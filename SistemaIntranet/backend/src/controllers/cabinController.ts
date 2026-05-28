import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getLocationsWithCabins = async (req: Request, res: Response) => {
    try {
        const locations = await prisma.location.findMany({
            include: {
                cabins: {
                    orderBy: { identifier: 'asc' }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.json(locations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener sedes y cabañas' });
    }
};
