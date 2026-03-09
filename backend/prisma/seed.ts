import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Create Locations
    const santaTeresa = await prisma.location.create({
        data: { name: 'Santa Teresa', description: 'Cabañas en Santa Teresa' }
    });
    const laPaloma = await prisma.location.create({
        data: { name: 'La Paloma', description: 'Cabañas en La Paloma' }
    });
    const baen = await prisma.location.create({
        data: { name: 'Baen', description: 'Cabañas en Baen' }
    });

    // Create Cabins
    // Santa Teresa: 3
    for (let i = 1; i <= 3; i++) {
        await prisma.cabin.create({
            data: { location_id: santaTeresa.id, identifier: `Santa Teresa ${i}`, capacity: 4 }
        });
    }
    // La Paloma: 10
    for (let i = 1; i <= 10; i++) {
        await prisma.cabin.create({
            data: { location_id: laPaloma.id, identifier: `La Paloma ${i}`, capacity: 4 }
        });
    }
    // Baen: 5
    for (let i = 1; i <= 5; i++) {
        await prisma.cabin.create({
            data: { location_id: baen.id, identifier: `Baen ${i}`, capacity: 4 }
        });
    }

    // Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
        where: { correo: 'admin@armada.mil.uy' },
        update: {},
        create: {
            nombre: 'Admin',
            apellido: 'Armada',
            cedula: '12345678',
            legajo: 'ADM001',
            correo: 'admin@armada.mil.uy',
            telefono: '099000000',
            password_hash: adminPassword,
            role: 'administrador'
        }
    });

    // Create test user (role: usuario)
    const usuarioPassword = await bcrypt.hash('usuario123', 10);
    await prisma.user.upsert({
        where: { correo: 'usuario@armada.mil.uy' },
        update: {},
        create: {
            nombre: 'Usuario',
            apellido: 'Prueba',
            cedula: '11111111',
            legajo: 'USR001',
            correo: 'usuario@armada.mil.uy',
            telefono: '099111111',
            password_hash: usuarioPassword,
            role: 'usuario'
        }
    });

    // Create test user (role: administrador_reservas)
    const admReservasPassword = await bcrypt.hash('reservas123', 10);
    await prisma.user.upsert({
        where: { correo: 'reservas@armada.mil.uy' },
        update: {},
        create: {
            nombre: 'Admin',
            apellido: 'Reservas',
            cedula: '22222222',
            legajo: 'RSV001',
            correo: 'reservas@armada.mil.uy',
            telefono: '099222222',
            password_hash: admReservasPassword,
            role: 'administrador_reservas'
        }
    });

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
