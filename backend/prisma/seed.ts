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
    const baena = await prisma.location.create({
        data: { name: 'Baena', description: 'Cabañas en Baena' }
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
    // Baena: 5
    for (let i = 1; i <= 5; i++) {
        await prisma.cabin.create({
            data: { location_id: baena.id, identifier: `Baena ${i}`, capacity: 4 }
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
