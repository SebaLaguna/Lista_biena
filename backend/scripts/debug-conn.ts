import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function debug() {
    console.log('--- Debugging Connectivity ---');
    const authUrl = process.env.SMTP_AUTH_URL || '';
    console.log('Probando Auth URL:', authUrl);
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', process.env.SMTP_CLIENT_ID || '');
        params.append('client_secret', process.env.SMTP_CLIENT_SECRET || '');

        console.log('Probando Auth con parámetros en el body (Capitalized ID)...');
        const response = await fetch(authUrl, {
            method: 'POST',
            body: new URLSearchParams({ 
                'grant_type': 'client_credentials',
                'client_id': process.env.SMTP_CLIENT_ID || '',
                'client_secret': process.env.SMTP_CLIENT_SECRET || ''
            }),
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('Status Auth:', response.status);
        const data = await response.json() as any;
        console.log('Respuesta Auth:', JSON.stringify(data, null, 2));
    } catch (error: any) {
        console.error('Error en Auth URL:', error.name === 'AbortError' ? 'Timeout' : error.message);
    }

    console.log('\n--- Probando Puerto SMTP ---');
    const smtpHost = process.env.SMTP_HOST || '';
    const smtpPort = process.env.SMTP_PORT || '';
    console.log(`Host: ${smtpHost}, Puerto: ${smtpPort}`);
    // No podemos hacer telnet fácilmente, pero podemos intentar un fetch (fallará pero dirá si el host es inalcanzable)
}

debug();
