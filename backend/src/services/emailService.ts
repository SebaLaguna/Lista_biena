import nodemailer from 'nodemailer';

// Configuración temporal (o utilizar vars de entorno)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    auth: {
        user: process.env.SMTP_USER || 'test@ethereal.email',
        pass: process.env.SMTP_PASS || 'password'
    }
});

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        const info = await transporter.sendMail({
            from: '"Sistema BIENA - Armada Nacional" <no-reply@armada.mil.uy>',
            to,
            subject,
            html
        });
        console.log(`Email enviado a ${to} - MessageId: ${info.messageId}`);
    } catch (error) {
        console.error('Error enviando email:', error);
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
