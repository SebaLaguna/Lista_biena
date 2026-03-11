import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database with institutional data...');

    // 1. Locations (using name as unique key for upsert)
    const locationsData = [
        { name: 'Santa Teresa', description: 'Cabañas en el Parque Nacional Santa Teresa' },
        { name: 'La Paloma', description: 'Cabañas en el balneario La Paloma' },
        { name: 'BAEN', description: 'Base Aeronaval' }
    ];

    const locations: { [key: string]: any } = {};

    for (const loc of locationsData) {
        const createdLoc = await prisma.location.upsert({
            where: { name: loc.name } as any,
            update: { description: loc.description },
            create: { name: loc.name, description: loc.description }
        });
        locations[loc.name] = createdLoc;
        console.log(`Location verified: ${loc.name}`);
    }

    // 2. Cabins
    const cabinCounts = [
        { locName: 'Santa Teresa', count: 3, capacity: 4 },
        { locName: 'La Paloma', count: 10, capacity: 4 },
        { locName: 'BAEN', count: 5, capacity: 4 }
    ];

    for (const item of cabinCounts) {
        const locId = locations[item.locName].id;
        for (let i = 1; i <= item.count; i++) {
            const identifier = `${item.locName} ${i}`;
            await prisma.cabin.upsert({
                where: { id: `fixed-cabin-${item.locName.toLowerCase().replace(' ', '-')}-${i}` }, // Fixed ID to prevent duplicates if name changes
                update: {
                    identifier,
                    capacity: item.capacity,
                    location_id: locId
                },
                create: {
                    id: `fixed-cabin-${item.locName.toLowerCase().replace(' ', '-')}-${i}`,
                    identifier,
                    capacity: item.capacity,
                    location_id: locId,
                    status: 'disponible'
                }
            });
        }
        console.log(`Verified ${item.count} cabins for ${item.locName}`);
    }

    // 3. Default Users
    // Create/Update Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
        where: { correo: 'admin@armada.mil.uy' },
        update: {
            status: 'aprobado',
            password_hash: adminPassword,
            role: 'administrador'
        },
        create: {
            nombre: 'Admin',
            apellido: 'Armada',
            cedula: '12345678',
            legajo: 'ADM001',
            correo: 'admin@armada.mil.uy',
            telefono: '099000000',
            password_hash: adminPassword,
            role: 'administrador',
            status: 'aprobado'
        }
    });

    const usuarioPassword = await bcrypt.hash('usuario123', 10);
    await prisma.user.upsert({
        where: { correo: 'usuario@armada.mil.uy' },
        update: {
            status: 'aprobado',
            password_hash: usuarioPassword,
            role: 'usuario'
        },
        create: {
            nombre: 'Usuario',
            apellido: 'Prueba',
            cedula: '11111111',
            legajo: 'USR001',
            correo: 'usuario@armada.mil.uy',
            telefono: '099111111',
            password_hash: usuarioPassword,
            role: 'usuario',
            status: 'aprobado'
        }
    });

    const admReservasPassword = await bcrypt.hash('reservas123', 10);
    await prisma.user.upsert({
        where: { correo: 'reservas@armada.mil.uy' },
        update: {
            status: 'aprobado',
            password_hash: admReservasPassword,
            role: 'administrador_reservas'
        },
        create: {
            nombre: 'Admin',
            apellido: 'Reservas',
            cedula: '22222222',
            legajo: 'RSV001',
            correo: 'reservas@armada.mil.uy',
            telefono: '099222222',
            password_hash: admReservasPassword,
            role: 'administrador_reservas',
            status: 'aprobado'
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
