import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting intensive database cleanup...');

    // 1. Consolidate Locations
    const allLocations = await prisma.location.findMany();
    const locationGroups: { [key: string]: string[] } = {};

    allLocations.forEach(loc => {
        if (!locationGroups[loc.name]) {
            locationGroups[loc.name] = [];
        }
        locationGroups[loc.name].push(loc.id);
    });

    for (const [name, ids] of Object.entries(locationGroups)) {
        if (ids.length > 1) {
            const masterId = ids[0];
            const duplicateIds = ids.slice(1);

            console.log(`Consolidating location "${name}": Keeping ${masterId}, removing ${duplicateIds.length} duplicates.`);

            // Move all cabins to master
            await prisma.cabin.updateMany({
                where: { location_id: { in: duplicateIds } },
                data: { location_id: masterId }
            });

            // Delete duplicates
            await prisma.location.deleteMany({
                where: { id: { in: duplicateIds } }
            });
        }
    }

    // 2. Remove duplicate cabins (same identifier in same location)
    const allCabins = await prisma.cabin.findMany({
        orderBy: { identifier: 'asc' }
    });

    const cabinGroups: { [key: string]: string[] } = {};
    allCabins.forEach(cabin => {
        const key = `${cabin.location_id}|${cabin.identifier}`;
        if (!cabinGroups[key]) {
            cabinGroups[key] = [];
        }
        cabinGroups[key].push(cabin.id);
    });

    for (const [key, ids] of Object.entries(cabinGroups)) {
        if (ids.length > 1) {
            const masterId = ids[0];
            const duplicateIds = ids.slice(1);
            console.log(`Removing duplicate cabin "${key.split('|')[1]}": Keeping ${masterId}, removing ${duplicateIds.length} duplicates.`);

            // Delete duplicates (note: this might fail if there are reservations, but we'll try)
            try {
                await prisma.cabin.deleteMany({
                    where: { id: { in: duplicateIds } }
                });
            } catch (e) {
                console.error(`Could not delete duplicate cabins for ${key} - likely have reservations. Manual intervention might be needed for these.`);
            }
        }
    }

    console.log('Cleanup finished.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
