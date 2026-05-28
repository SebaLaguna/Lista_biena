import net from 'net';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const host = process.env.SMTP_HOST || '172.16.0.84';
const ports = [25, 26, 587, 465];

async function checkPort(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(3000);
        
        console.log(`Probando ${host}:${port}...`);
        
        socket.on('connect', () => {
            console.log(`[EXITO] Conectado a ${host}:${port}`);
            socket.destroy();
            resolve(true);
        });
        
        socket.on('timeout', () => {
            console.log(`[FALLO] Timeout en ${host}:${port}`);
            socket.destroy();
            resolve(false);
        });
        
        socket.on('error', (err) => {
            console.log(`[FALLO] Error en ${host}:${port}: ${err.message}`);
            socket.destroy();
            resolve(false);
        });
        
        socket.connect(port, host);
    });
}

async function run() {
    console.log('--- Escaneo de Puertos SMTP ---');
    for (const port of ports) {
        await checkPort(port);
    }
    console.log('--- Escaneo Finalizado ---');
}

run();
