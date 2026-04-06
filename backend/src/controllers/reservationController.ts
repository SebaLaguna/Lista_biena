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
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
            return res.status(400).json({ error: 'La fecha de inicio no puede ser en el pasado.' });
        }

        if (start >= end) {
            return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la de inicio.' });
        }

        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 1 || diffDays > 7) {
            return res.status(400).json({ error: 'Las reservas deben durar entre 1 y 7 días.' });
        }

        // Check anticipation rules
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        const anticipationLimit = user.jerarquia === 'RET' ? 45 : 60;
        const maxDate = new Date();
        maxDate.setDate(today.getDate() + anticipationLimit);

        if (start > maxDate) {
            return res.status(400).json({ 
                error: `Como usuario ${user.jerarquia === 'RET' ? 'Retirado' : 'Activo'}, solo puedes reservar con hasta ${anticipationLimit} días de anticipación.` 
            });
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
            return res.status(400).json({ error: 'Ya tienes una reserva para estas fechas.' });
        }

        // Check cabin and its allowed hierarchies
        const cabin = await prisma.cabin.findUnique({
            where: { id: cabin_id },
            include: { location: true }
        });

        if (!cabin) {
            return res.status(404).json({ error: 'Cabaña no encontrada.' });
        }

            if (cabin.allowed_hierarchies && Array.isArray(cabin.allowed_hierarchies) && cabin.allowed_hierarchies.length > 0) {
                if (!cabin.allowed_hierarchies.includes(user.jerarquia)) {
                    return res.status(403).json({ error: 'Su jerarquía no tiene permitido reservar esta unidad' });
                }
            }

        if (cabin.capacity && occ > cabin.capacity) {
            return res.status(400).json({ error: `La capacidad máxima de esta cabaña es de ${cabin.capacity} ocupantes.` });
        }

        if (cabin.status !== 'disponible') {
            return res.status(400).json({ error: 'Esta cabaña no está disponible para reserva actualmente.' });
        }

        // Check for approved reservations
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
                details: `El usuario ${user.nombre} ${user.apellido} (${user.jerarquia}) solicitó reserva en ${cabin.location.name} - ${cabin.identifier} para ${occ} ocupantes.`
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
        sendReservationCreatedEmail(user.correo, user.nombre, start, end).catch(err => {
            console.error('Error enviando email de reserva en el background:', err);
        });

        res.status(201).json({ message: 'Reserva solicitada exitosamente', reservation });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar reserva' });
    }
};

export const cancelMyReservation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const userId = req.user?.id;
        const { comments } = req.body;

        if (!comments || comments.trim() === '') {
            res.status(400).json({ error: 'Debe proporcionar un motivo para la cancelación.' });
            return;
        }

        const reservation = await prisma.reservation.findUnique({ 
            where: { id },
            include: { user: true, cabin: true }
        });

        if (!reservation) {
            res.status(404).json({ error: 'Reserva no encontrada' });
            return;
        }

        if (reservation.user_id !== userId) {
            res.status(403).json({ error: 'No autorizado para cancelar esta reserva' });
            return;
        }

        if (reservation.status !== 'pendiente' && reservation.status !== 'aprobada') {
            res.status(400).json({ error: 'No se puede cancelar una reserva en estado ' + reservation.status });
            return;
        }

        const today = new Date();
        const start = new Date(reservation.start_date);
        
        if (today >= start) {
            res.status(400).json({ error: 'No se puede cancelar una reserva que ya comenzó o ya pasó.' });
            return;
        }

        await prisma.reservation.update({
            where: { id },
            data: { 
                status: 'cancelada',
                comments: comments
            }
        });

        await prisma.reservationHistory.create({
            data: {
                reservation_id: id,
                changed_by: userId as string,
                old_status: reservation.status,
                new_status: 'cancelada',
                comments: comments
            }
        });

        await prisma.systemLog.create({
            data: {
                user_id: userId as string,
                action: 'cancel_reservation',
                entity_type: 'Reservation',
                entity_id: id,
                details: `El usuario canceló su propia reserva (ID: ${id}). Motivo: ${comments}`
            }
        });

        // Notify Admins
        const admins = await prisma.user.findMany({ where: { role: 'admin_biena', status: 'aprobado' } });
        const adminEmails = admins.map(a => a.correo);
        
        const { sendAdminReservationCancelledEmail } = await import('../services/emailService');
        sendAdminReservationCancelledEmail(
            adminEmails, 
            `${reservation.user.nombre} ${reservation.user.apellido}`, 
            reservation.cabin.identifier, 
            reservation.start_date, 
            reservation.end_date, 
            comments
        ).catch(err => console.error("Admin Email Notif Error:", err));

        res.json({ message: 'Reserva cancelada exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno al cancelar la reserva' });
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

        const today = new Date();
        const estival = await prisma.estivalPeriod.findFirst({
            where: {
                start_date: { lte: today },
                end_date: { gte: today }
            }
        });
        const limitHours = estival ? 48 : 96;

        const enhancedReservations = reservations.map(r => {
            const start = new Date(r.start_date);
            const diffHours = (start.getTime() - today.getTime()) / (1000 * 60 * 60);
            return {
                ...r,
                isPenalizedCancel: r.status === 'aprobada' && diffHours < limitHours,
                cancelPeriodType: estival ? 'Estival' : 'Normal',
                cancelLimitHours: limitHours
            };
        });

        res.json(enhancedReservations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener mis reservas' });
    }
};

export const getPublicEstivalPeriods = async (req: Request, res: Response) => {
    try {
        const periods = await prisma.estivalPeriod.findMany({
            orderBy: { start_date: 'asc' }
        });
        res.json(periods);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener periodos estivales.' });
    }
};

export const getAdminReservations = async (req: AuthRequest, res: Response) => {
    try {
        const reservations = await prisma.reservation.findMany({
            include: {
                user: { select: { id: true, nombre: true, apellido: true, cedula: true, legajo: true, jerarquia: true, correo: true, telefono: true, role: true, status: true } },
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
        const adminId = req.user?.id as string;

        if (!['aprobada', 'rechazada', 'cancelada'].includes(status)) {
            return res.status(400).json({ error: 'Estado inválido.' });
        }

        if (status === 'rechazada' && (!comments || comments.trim() === '')) {
            return res.status(400).json({ error: 'El comentario es obligatorio al rechazar una reserva.' });
        }

        const reservation = await prisma.reservation.findUnique({ 
            where: { id },
            include: { user: true, cabin: { include: { location: true } } }
        });
        if (!reservation) {
            return res.status(404).json({ error: 'Reserva no encontrada.' });
        }

        // Penalty check for cancellations
        if (status === 'cancelada') {
            const today = new Date();
            const start = new Date(reservation.start_date);
            const estival = await prisma.estivalPeriod.findFirst({
                where: {
                    start_date: { lte: today },
                    end_date: { gte: today }
                }
            });

            const limitHours = estival ? 48 : 96;
            const diffHours = (start.getTime() - today.getTime()) / (1000 * 60 * 60);

            if (diffHours < limitHours) {
                // Here we could implement a real penalty, for now just a warning or blocking the action if strict
                console.log(`Cancelación tardía (${diffHours.toFixed(1)}h < ${limitHours}h).`);
            }
        }

        const updated = await prisma.reservation.update({
            where: { id },
            data: { 
                status,
                comments: comments || (status === 'cancelada' ? 'Cancelada por el usuario' : null)
            }
        });

        const admin = await prisma.user.findUnique({ where: { id: adminId } });

        await prisma.reservationHistory.create({
            data: {
                reservation_id: id,
                changed_by: adminId,
                old_status: reservation.status,
                new_status: status,
                comments: comments || (status === 'cancelada' ? 'Cancelada por el usuario' : '')
            }
        });

        await prisma.systemLog.create({
            data: {
                user_id: adminId,
                action: 'update_reservation_status',
                entity_type: 'Reservation',
                entity_id: id,
                details: `El administrador ${admin?.nombre} ${admin?.apellido} cambió el estado de la reserva ID ${id} (Cabaña: ${reservation.cabin.identifier}) de ${reservation.status} a ${status}.`
            }
        });

        // Send Email asynchronously
        if (reservation.user) {
            sendReservationStatusChangedEmail(reservation.user.correo, reservation.user.nombre, status, comments).catch(err => {
                console.error('Error enviando email de cambio de estado:', err);
            });
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
