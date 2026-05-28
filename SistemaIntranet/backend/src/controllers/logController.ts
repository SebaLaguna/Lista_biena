import { Response, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';

const prisma = new PrismaClient();

export const getSystemLogs = async (req: AuthRequest, res: Response) => {
    try {
        const logs = await prisma.systemLog.findMany({
            include: { user: { select: { nombre: true, apellido: true, correo: true, role: true } } },
            orderBy: { created_at: 'desc' },
            take: 200 // Limit for performance
        });
        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los logs del sistema' });
    }
};
