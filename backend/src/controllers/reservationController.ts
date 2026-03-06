import { Response, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';

const prisma = new PrismaClient();

// HELPER: verify it's Monday
const isMonday = (date: Date) => date.getUTCDay() === 1;

export const checkAvailability = async (req: Request, res: Response) => {
    try {
        const { start_date, end_date, location_id } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'Faltan fechas start_date y end_date' });
        }

        const start = new Date(start_date as string);
        const end = new Date(end_date as string);

        // Fetch overlapping reservations
        const reservations = await prisma.reservation.findMany({
            where: {
                status: { in: ['aprobada', 'pendiente'] },
                start_date: { lt: end },
                end_date: { gt: start },
                cabin: location_id ? { location_id: location_id as string } : undefined
            },
            include: { cabin: true }
        });

        res.json(reservations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al verificar disponibilidad' });
    }
};

export const createReservation = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { cabin_id, start_date, end_date } = req.body;

        if (!cabin_id || !start_date || !end_date) {
            return res.status(400).json({ error: 'Faltan datos de la reserva' });
        }

        const start = new Date(start_date);
        const end = new Date(end_date);

        if (!isMonday(start) || !isMonday(end)) {
            return res.status(400).json({ error: 'Las reservas deben comenzar un lunes y terminar un lunes' });
        }

        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays !== 7) {
            return res.status(400).json({ error: 'Las reservas deben ser de exactamente 1 semana (7 días)' });
        }

        // Check if user already has a reservation for these dates
        const userReservations = await prisma.reservation.findFirst({
            where: {
                user_id: userId,
                status: { in: ['aprobada', 'pendiente'] },
                start_date: { lt: end },
                end_date: { gt: start }
            }
        });

        if (userReservations) {
            return res.status(400).json({ error: 'Ya tienes una reserva para estas fechas. No puedes reservar dos ubicaciones distintas.' });
        }

        // Check cabin availability
        const cabinReservations = await prisma.reservation.findFirst({
            where: {
                cabin_id,
                status: { in: ['aprobada', 'pendiente'] },
                start_date: { lt: end },
                end_date: { gt: start }
            }
        });

        if (cabinReservations) {
            return res.status(400).json({ error: 'La cabaña seleccionada ya no está disponible para esas fechas.' });
        }

        const reservation = await prisma.reservation.create({
            data: {
                user_id: userId,
                cabin_id,
                start_date: start,
                end_date: end,
                status: 'pendiente'
            }
        });

        // Registra en el historial
        await prisma.reservationHistory.create({
            data: {
                reservation_id: reservation.id,
                changed_by: userId,
                new_status: 'pendiente',
                comments: 'Reserva solicitada'
            }
        });

        res.status(201).json({ message: 'Reserva solicitada exitosamente', reservation });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar reserva' });
    }
};

export const getMyReservations = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const reservations = await prisma.reservation.findMany({
            where: { user_id: userId },
            include: {
                cabin: {
                    include: { location: true }
                }
            },
            orderBy: { start_date: 'desc' }
        });
        res.json(reservations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener mis reservas' });
    }
};

export const getAdminReservations = async (req: AuthRequest, res: Response) => {
    try {
        const reservations = await prisma.reservation.findMany({
            include: {
                user: { select: { id: true, nombre: true, apellido: true, cedula: true, legajo: true } },
                cabin: { include: { location: true } }
            },
            orderBy: { created_at: 'desc' }
        });
        res.json(reservations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error listando reservaciones.' });
    }
};

export const updateReservationStatus = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { status, comments } = req.body;
        const adminId = req.user?.id;

        if (!['aprobada', 'rechazada', 'cancelada'].includes(status)) {
            return res.status(400).json({ error: 'Estado inválido.' });
        }

        const reservation = await prisma.reservation.findUnique({ where: { id } });
        if (!reservation) {
            return res.status(404).json({ error: 'Reserva no encontrada.' });
        }

        const updated = await prisma.reservation.update({
            where: { id },
            data: { status }
        });

        await prisma.reservationHistory.create({
            data: {
                reservation_id: id,
                changed_by: adminId,
                old_status: reservation.status,
                new_status: status,
                comments
            }
        });

        res.json({ message: 'Estado actualizado', reservation: updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error actualizando estado.' });
    }
};

export const getUserHistory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.params.userId as string;

        const reservations = await prisma.reservation.findMany({
            where: { user_id: userId },
            include: { cabin: { include: { location: true } }, history: true },
            orderBy: { start_date: 'desc' }
        });

        res.json(reservations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener historial del usuario' });
    }
};
