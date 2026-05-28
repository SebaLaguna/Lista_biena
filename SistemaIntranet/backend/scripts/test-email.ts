import dotenv from 'dotenv';
import path from 'path';
import { sendEmail } from '../src/services/emailService';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

async function test() {
    console.log('--- Probando envío de email ---');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('User:', process.env.SMTP_USER);
    
    try {
        await sendEmail(
            process.env.SMTP_USER || '', // Se envía a sí mismo para probar
            'Prueba de Conexión SMTP - BIENA',
            '<h1>Prueba Exitosa</h1><p>Si recibes esto, la configuración de SMTP con la key de MFA está funcionando correctamente.</p>'
        );
        console.log('Email de prueba enviado exitosamente.');
    } catch (error) {
        console.error('Error en la prueba de email:', error);
    }
}

test();
