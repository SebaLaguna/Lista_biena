import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning all locations and cabins to ensure 100% clean state...');

    // Delete in order to respect foreign keys
    try {
        await prisma.reservationHistory.deleteMany();
        await prisma.reservation.deleteMany();
        await prisma.blockedDate.deleteMany();
        await prisma.cabin.deleteMany();
        await prisma.location.deleteMany();
        console.log('Successfully cleared all location and cabin related data.');
    } catch (e) {
        console.error('Error during clearing:', e);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
