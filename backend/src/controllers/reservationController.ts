import { Response, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendReservationCreatedEmail, sendReservationStatusChangedEmail } from '../services/emailService';

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

        // Fetch overlapping blocked dates
        const blockedDates = await prisma.blockedDate.findMany({
            where: {
                start_date: { lt: end },
                end_date: { gt: start },
                OR: [
                    { cabin_id: null },
                    location_id ? { cabin: { location_id: location_id as string } } : {}
                ]
            }
        });

        res.json({ reservations, blockedDates });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al verificar disponibilidad' });
    }
};

export const createReservation = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { cabin_id, start_date, end_date, occupants } = req.body;

        if (!cabin_id || !start_date || !end_date || occupants === undefined) {
            return res.status(400).json({ error: 'Faltan datos de la reserva' });
        }

        const occ = parseInt(occupants, 10);
        if (isNaN(occ) || occ < 1) {
            return res.status(400).json({ error: 'El mínimo de ocupantes es 1' });
        }

        const start = new Date(start_date);
        const end = new Date(end_date);

        if (start >= end) {
            return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la de inicio' });
        }

        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 7) {
            return res.status(400).json({ error: 'Las reservas no pueden superar los 7 días consecutivos' });
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

        // Check cabin capacity
        const cabin = await prisma.cabin.findUnique({
            where: { id: cabin_id }
        });

        if (!cabin) {
            return res.status(404).json({ error: 'Cabaña no encontrada.' });
        }

        if (cabin.capacity && occ > cabin.capacity) {
            return res.status(400).json({ error: `La capacidad máxima de esta cabaña es de ${cabin.capacity} ocupantes.` });
        }

        if (cabin.status !== 'disponible') {
            return res.status(400).json({ error: 'Esta cabaña no está disponible para reserva actualmente.' });
        }

        // Check cabin reservations (Only block if there is already an approved reservation)
        const cabinReservations = await prisma.reservation.findFirst({
            where: {
                cabin_id,
                status: 'aprobada',
                start_date: { lt: end },
                end_date: { gt: start }
            }
        });

        if (cabinReservations) {
            return res.status(400).json({ error: 'La cabaña seleccionada ya no está disponible para esas fechas.' });
        }

        // Check blocked dates
        const overlappingBlocked = await prisma.blockedDate.findFirst({
            where: {
                OR: [
                    { cabin_id: cabin_id },
                    { cabin_id: null }
                ],
                start_date: { lt: end },
                end_date: { gt: start }
            }
        });

        if (overlappingBlocked) {
            return res.status(400).json({ error: 'Algunas de las fechas seleccionadas se encuentran bloqueadas administrativamente.' });
        }

        const reservation = await prisma.reservation.create({
            data: {
                user_id: userId,
                cabin_id,
                start_date: start,
                end_date: end,
                occupants: occ,
                status: 'pendiente'
            }
        });

        // Registrar en logs del sistema
        await prisma.systemLog.create({
            data: {
                user_id: userId,
                action: 'create_reservation',
                entity_type: 'Reservation',
                entity_id: reservation.id,
                details: `Usuario solicitó reserva para ${occ} ocupantes.`
            }
        });

        // Registra en el historial
        await prisma.reservationHistory.create({
            data: {
                reservation_id: reservation.id,
                changed_by: userId as string,
                new_status: 'pendiente',
                comments: 'Reserva solicitada'
            }
        });

        // Send Email asynchronously
        const u = await prisma.user.findUnique({ where: { id: userId } });
        if (u) {
            sendReservationCreatedEmail(u.correo, u.nombre, start, end).catch(err => {
                console.error('Error enviando email de reserva en el background:', err);
            });
        }

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

        if (status === 'rechazada' && (!comments || comments.trim() === '')) {
            return res.status(400).json({ error: 'El comentario es obligatorio al rechazar una reserva.' });
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

        await prisma.systemLog.create({
            data: {
                user_id: adminId,
                action: 'update_reservation_status',
                entity_type: 'Reservation',
                entity_id: id,
                details: `Reserva cambió a ${status}.`
            }
        });

        // Send Email asynchronously
        if (reservation.user_id) {
            const u = await prisma.user.findUnique({ where: { id: reservation.user_id } });
            if (u) {
                sendReservationStatusChangedEmail(u.correo, u.nombre, status, comments).catch(err => {
                    console.error('Error enviando email de cambio de estado en guardería:', err);
                });
            }
        }

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

export const deleteReservation = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
        const adminId = req.user?.id as string | undefined;

        const reservation = await prisma.reservation.findUnique({ where: { id } });
        if (!reservation) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        // Delete related history first
        await prisma.reservationHistory.deleteMany({ where: { reservation_id: id } });
        await prisma.reservation.delete({ where: { id } });

        await prisma.systemLog.create({
            data: {
                user_id: adminId,
                action: 'delete_reservation',
                entity_type: 'Reservation',
                entity_id: id,
                details: `Reserva eliminada por SuperAdmin (ID: ${id})`
            }
        });

        res.json({ message: 'Reserva eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar la reserva' });
    }
};
