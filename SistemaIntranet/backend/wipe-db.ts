import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- EMERGENCY DB WIPE ---');
    console.log('Cleaning all tables...');
    await prisma.reservationHistory.deleteMany();
    await prisma.reservation.deleteMany();
    await prisma.cabin.deleteMany();
    await prisma.location.deleteMany();
    await prisma.user.deleteMany();
    console.log('Database is now empty.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
