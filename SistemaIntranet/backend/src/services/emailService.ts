import nodemailer from 'nodemailer';

// Configuración temporal (o utilizar vars de entorno)
const port = parseInt(process.env.SMTP_PORT || '587', 10);

const getAccessToken = async () => {
    if (!process.env.SMTP_CLIENT_ID || !process.env.SMTP_CLIENT_SECRET || !process.env.SMTP_AUTH_URL) {
        return null;
    }

    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', process.env.SMTP_CLIENT_ID);
        params.append('client_secret', process.env.SMTP_CLIENT_SECRET);

        const response = await fetch(process.env.SMTP_AUTH_URL, {
            method: 'POST',
            body: params,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const data = await response.json() as any;
        return data.access_token;
    } catch (error) {
        console.error('Error obteniendo token de acceso Keycloak:', error);
        return null;
    }
};

const createTransporter = async () => {
    const accessToken = await getAccessToken();

    const auth: any = accessToken 
        ? {
            type: 'OAuth2',
            user: process.env.SMTP_USER,
            accessToken: accessToken,
            method: 'XOAUTH2'
        }
        : {
            user: process.env.SMTP_USER || 'test@ethereal.email',
            pass: process.env.SMTP_PASS || 'password'
        };

    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: smtpPort,
        secure: smtpPort === 465,
        auth: auth,
        tls: {
            rejectUnauthorized: false
        }
    });
};

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        const transporter = await createTransporter();
        const info = await transporter.sendMail({
            from: `"Sistema BIENA - Armada Nacional" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        });
        console.log(`Email enviado a ${to} - MessageId: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('Error enviando email:', error);
        throw error;
    }
};

export const sendReservationCreatedEmail = async (correo: string, nombre: string, startDate: Date, endDate: Date) => {
    const start = startDate.toLocaleDateString();
    const end = endDate.toLocaleDateString();
    const html = `
        <h3>Hola ${nombre},</h3>
        <p>Tu solicitud de reserva desde el ${start} hasta el ${end} ha sido recibida y se encuentra en estado <b>Pendiente</b>.</p>
        <p>Un administrador de BIENA revisará tu solicitud a la brevedad.</p>
        <br>
        <p>Atentamente,<br>Servicio de Bienestar - Armada Nacional</p>
    `;
    await sendEmail(correo, 'Solicitud de Reserva Recibida - BIENA', html);
};

export const sendReservationStatusChangedEmail = async (correo: string, nombre: string, status: string, comments?: string) => {
    let statusText = status === 'aprobada' ? 'Aprobada' : status === 'rechazada' ? 'Rechazada' : 'Cancelada';
    let commentText = comments ? `<p><b>Comentarios del administrador:</b> ${comments}</p>` : '';

    const html = `
        <h3>Hola ${nombre},</h3>
        <p>El estado de tu solicitud de reserva ha cambiado a: <b>${statusText}</b>.</p>
        ${commentText}
        <br>
        <p>Atentamente,<br>Servicio de Bienestar - Armada Nacional</p>
    `;
    await sendEmail(correo, `Actualización de Reserva: ${statusText} - BIENA`, html);
};

export const sendRegistrationReceivedEmail = async (correo: string, nombre: string) => {
    const html = `
        <h3>Hola ${nombre},</h3>
        <p>Tu solicitud de registro en el Sistema BIENA de la Armada Nacional ha sido recibida exitosamente y se encuentra en estado <b>Pendiente</b>.</p>
        <p>El mando administrativo revisará tus datos a la brevedad. Te enviaremos un nuevo correo notificándote cuando el acceso sea autorizado.</p>
        <br>
        <p>Atentamente,<br>Servicio de Bienestar - Armada Nacional</p>
    `;
    await sendEmail(correo, 'Solicitud de Registro - BIENA', html);
};

export const sendUserStatusUpdatedEmail = async (correo: string, nombre: string, status: string) => {
    let statusMsg = '';
    if (status === 'aprobado') {
        statusMsg = 'ha sido <b>aprobada</b>. Ya puedes iniciar sesión y solicitar reservas de cabañas.';
    } else if (status === 'inactivo') {
        statusMsg = 'ha sido <b>inactivada</b>. Por favor comunícate con la administración para más detalles.';
    } else {
        statusMsg = `se encuentra actualmente en estado: <b>${status}</b>.`;
    }

    const html = `
        <h3>Hola ${nombre},</h3>
        <p>Te informamos que tu cuenta en el Sistema BIENA ${statusMsg}</p>
        <br>
        <p>Atentamente,<br>Servicio de Bienestar - Armada Nacional</p>
    `;

    // Choose subject
    const subject = status === 'aprobado' ? 'Cuenta Aprobada - BIENA' : 'Actualización de Cuenta - BIENA';

    await sendEmail(correo, subject, html);
};

export const sendAdminReservationCancelledEmail = async (adminEmails: string[], userName: string, cabinIdentifier: string, startDate: Date, endDate: Date, comment: string) => {
    const start = startDate.toLocaleDateString('es-ES');
    const end = endDate.toLocaleDateString('es-ES');
    const html = `
        <h3>Aviso de Cancelación de Reserva</h3>
        <p>El usuario <b>${userName}</b> ha cancelado su reserva para la unidad <b>${cabinIdentifier}</b> (del ${start} al ${end}).</p>
        <p><b>Motivo / Comentarios del usuario:</b></p>
        <blockquote style="background-color: #f9f9f9; padding: 10px; border-left: 4px solid #cc0000; margin: 10px 0;">
            ${comment}
        </blockquote>
        <br>
        <p>Sistema Automatizado BIENA</p>
    `;

    for (const email of adminEmails) {
        if (email) {
            await sendEmail(email, `Cancelación de Reserva: ${cabinIdentifier} - BIENA`, html).catch(e => console.error("Error enviando email a admin:", e));
        }
    }
};
