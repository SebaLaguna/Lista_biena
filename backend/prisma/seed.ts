import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('--- BIENA SYSTEM BULK SEEDING START ---');

    // 1. Locations
    const locationsData = [
        { name: 'Carmelo', description: 'Base Naval de Carmelo - Destino de Descanso' },
        { name: 'Laguna del Sauce', description: 'Base Aeronaval Capitán Carlos A. Curbelo' },
        { name: 'Jose Ignacio', description: 'Cabañas Exclusivas en Jose Ignacio' },
        { name: 'La Paloma', description: 'Cabañas en el balneario La Paloma - Rocha' },
        { name: 'Cabo Polonio', description: 'Refugio Natural en Cabo Polonio' },
        { name: 'Santa Teresa', description: 'Parque Nacional Santa Teresa - Servicio de Alojamiento' }
    ];

    const locationsMap: { [key: string]: any } = {};
    for (const loc of locationsData) {
        locationsMap[loc.name] = await prisma.location.upsert({
            where: { name: loc.name },
            update: { description: loc.description },
            create: { name: loc.name, description: loc.description }
        });
    }
    console.log('✔ Locations verified.');

    // 2. Cabins
    const cabinCounts = [
        { locName: 'Carmelo', count: 4, capacity: 4 },
        { locName: 'Laguna del Sauce', count: 6, capacity: 6 },
        { locName: 'Jose Ignacio', count: 2, capacity: 4 },
        { locName: 'La Paloma', count: 15, capacity: 4 },
        { locName: 'Cabo Polonio', count: 5, capacity: 2 },
        { locName: 'Santa Teresa', count: 8, capacity: 5 }
    ];

    for (const item of cabinCounts) {
        const locId = locationsMap[item.locName].id;
        for (let i = 1; i <= item.count; i++) {
            const identifier = `${item.locName.substring(0, 3).toUpperCase()}-${i.toString().padStart(2, '0')}`;
            await prisma.cabin.upsert({
                where: { identifier },
                update: { capacity: item.capacity, location_id: locId },
                create: {
                    identifier,
                    capacity: item.capacity,
                    location_id: locId,
                    status: 'disponible',
                    allowed_hierarchies: []
                }
            });
        }
    }
    console.log('✔ Cabins scaled and verified.');

    // 3. User Generation Utilities
    const names = ['Juan', 'Maria', 'Jose', 'Ana', 'Luis', 'Carmen', 'Pedro', 'Elena', 'Carlos', 'Silvia', 'Roberto', 'Patricia', 'Diego', 'Lucia', 'Fernando', 'Marta', 'Sebastian', 'Gabriela', 'Alejandro', 'Florencia'];
    const surnames = ['Rodriguez', 'Gonzalez', 'Gomez', 'Fernandez', 'Lopez', 'Diaz', 'Martinez', 'Perez', 'Garcia', 'Sanchez', 'Romero', 'Vazquez', 'Sosa', 'Silva', 'Pereira', 'Olivera', 'Acosta', 'Suarez', 'Mendez', 'Rios'];
    const jerarquias = ['ALM', 'CA', 'CN', 'CF', 'CC', 'TN', 'AN', 'AF', 'GM', 'SOC', 'SOP', 'SOS', 'CP', 'CS', 'MP', 'RET'];
    
    const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Core Admins
    await prisma.user.upsert({
        where: { correo: 'admin@armada.mil.uy' },
        update: { role: 'super_admin', status: 'aprobado', password_hash: hashedPassword },
        create: {
            correo: 'admin@armada.mil.uy',
            nombre: 'Admin',
            apellido: 'Supremo',
            cedula: '1.111.111-1',
            legajo: 'ADM-001',
            jerarquia: 'CN',
            password_hash: hashedPassword,
            role: 'super_admin',
            status: 'aprobado'
        }
    });

    await prisma.user.upsert({
        where: { correo: 'biena@armada.mil.uy' },
        update: { role: 'admin_biena', status: 'aprobado', password_hash: hashedPassword },
        create: {
            correo: 'biena@armada.mil.uy',
            nombre: 'Admin',
            apellido: 'Biena',
            cedula: '2.222.222-2',
            legajo: 'ADM-002',
            jerarquia: 'CF',
            password_hash: hashedPassword,
            role: 'admin_biena',
            status: 'aprobado'
        }
    });

    // Bulk User Generation (60 users)
    const users: any[] = [];
    console.log('Generating 60 users...');
    for (let i = 0; i < 60; i++) {
        const nombre = getRandom(names);
        const apellido = getRandom(surnames);
        const email = `${nombre.toLowerCase()}.${apellido.toLowerCase()}${i}@armada.mil.uy`;
        const user = await prisma.user.upsert({
            where: { correo: email },
            update: { status: i < 5 ? 'pendiente' : 'aprobado' },
            create: {
                correo: email,
                nombre,
                apellido,
                cedula: `${Math.floor(Math.random() * 5 + 1)}.${Math.floor(Math.random() * 899 + 100)}.${Math.floor(Math.random() * 899 + 100)}-${Math.floor(Math.random() * 9)}`,
                legajo: `LEG-${100000 + i}`,
                jerarquia: getRandom(jerarquias),
                telefono: `099${Math.floor(Math.random() * 899999 + 100000)}`,
                password_hash: hashedPassword,
                role: 'common_user',
                status: i < 5 ? 'pendiente' : 'aprobado'
            }
        });
        users.push(user);
    }
    console.log('✔ Users generated.');

    // 4. Reservation Generation (Realistic & Non-Overlapping)
    console.log('Generating ~180 realistic reservations...');
    await prisma.reservationHistory.deleteMany({});
    await prisma.reservation.deleteMany({});

    const allCabins = await prisma.cabin.findMany();
    
    for (const cabin of allCabins) {
        // Start from beginning of 2025
        let currentPointer = new Date(2025, 0, 5); 
        
        // 6-8 reservations per cabin
        const resCount = 6 + Math.floor(Math.random() * 3);
        
        for (let j = 0; j < resCount; j++) {
            const start = new Date(currentPointer);
            start.setDate(start.getDate() + Math.floor(Math.random() * 10 + 2)); // Gap of 2-12 days
            
            const end = new Date(start);
            end.setDate(end.getDate() + Math.floor(Math.random() * 5 + 2)); // Stay of 2-7 days
            
            // Safety: Don't go beyond 2025
            if (start.getFullYear() > 2025) break;

            const user = getRandom(users.filter(u => u.status === 'aprobado'));
            const status = j === 0 && Math.random() > 0.5 ? 'pendiente' : getRandom(['aprobada', 'aprobada', 'aprobada', 'cancelada', 'rechazada']);

            await prisma.reservation.create({
                data: {
                    user_id: user.id,
                    cabin_id: cabin.id,
                    start_date: start,
                    end_date: end,
                    occupants: Math.min(cabin.capacity || 4, Math.floor(Math.random() * 4 + 1)),
                    status: status as any,
                    created_at: new Date(2024, 11, Math.floor(Math.random() * 28 + 1)) // Created in Dec 2024
                }
            });

            // Move pointer forward
            currentPointer = new Date(end);
            currentPointer.setDate(currentPointer.getDate() + Math.floor(Math.random() * 5 + 1));
        }
    }

    console.log('✔ Reservations successfully distributed across 2025.');
    console.log('--- SEEDING COMPLETE! SYSTEM IS ALIVE ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
