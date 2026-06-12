import { Response, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendReservationCreatedEmail, sendReservationStatusChangedEmail } from '../services/emailService';

const prisma = new PrismaClient();

// HELPER: verify it's Monday
const isMonday = (date: Date) => date.getUTCDay() === 1;

const getMondayOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getUTCDay();
    const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setUTCDate(diff);
    monday.setUTCHours(0, 0, 0, 0);
    return monday;
};

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

        // --- ESTIVAL SEASON APPLICATION ---
        if (req.body.is_estival) {
            const { options, occupants } = req.body;
            if (!options || !Array.isArray(options) || options.length === 0 || options.length > 2) {
                return res.status(400).json({ error: 'Debe especificar 1 o 2 opciones de postulación.' });
            }

            const occ = parseInt(occupants, 10);
            if (isNaN(occ) || occ < 1) {
                return res.status(400).json({ error: 'El mínimo de ocupantes es 1.' });
            }
            if (occ > 6) {
                return res.status(400).json({ error: 'La cantidad máxima de ocupantes permitida es 6, incluyendo al solicitante.' });
            }

            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const reservationsToCreate = [];
            const applicationGroup = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

            for (const opt of options) {
                const { location_id, start_date, end_date, priority } = opt;
                if (!location_id || !start_date || !end_date || priority === undefined) {
                    return res.status(400).json({ error: 'Datos de opción de postulación incompletos.' });
                }

                const start = new Date(start_date);
                const end = new Date(end_date);

                if (start < today) {
                    return res.status(400).json({ error: 'La fecha de inicio de la postulación no puede ser en el pasado.' });
                }
                if (start >= end) {
                    return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la de inicio.' });
                }

                // Verify Monday-to-Monday week
                if (start.getUTCDay() !== 1) {
                    return res.status(400).json({ error: 'Las postulaciones estivales deben iniciar un día Lunes.' });
                }
                if (end.getUTCDay() !== 1) {
                    return res.status(400).json({ error: 'Las postulaciones estivales deben terminar un día Lunes.' });
                }
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays !== 7 && diffDays !== 14) {
                    return res.status(400).json({ error: 'Las postulaciones estivales deben durar exactamente 1 o 2 semanas.' });
                }

                // En temporada estival no se aplica el límite de anticipación de 45/60 días.

                // Verify that the requested start and end dates are inside an active EstivalPeriod
                const estivalPeriod = await prisma.estivalPeriod.findFirst({
                    where: {
                        start_date: { lte: start },
                        end_date: { gte: end }
                    }
                });
                if (!estivalPeriod) {
                    return res.status(400).json({ error: 'La fecha seleccionada no pertenece a ningún período estival activo.' });
                }

                // Verify location exists
                const location = await prisma.location.findUnique({ where: { id: location_id } });
                if (!location) {
                    return res.status(404).json({ error: 'La sede seleccionada no existe.' });
                }

                reservationsToCreate.push({
                    user_id: userId!,
                    location_id,
                    start_date: start,
                    end_date: end,
                    occupants: occ,
                    priority: parseInt(priority, 10),
                    application_group: applicationGroup,
                    status: 'pendiente' as const
                });
            }

            // Check if user already has any active reservations/applications for these dates
            for (const resToCreate of reservationsToCreate) {
                const userReservations = await prisma.reservation.findFirst({
                    where: {
                        user_id: userId,
                        status: { in: ['aprobada', 'pendiente'] },
                        start_date: { lt: resToCreate.end_date },
                        end_date: { gt: resToCreate.start_date }
                    }
                });
                if (userReservations) {
                    return res.status(400).json({ error: 'Ya tienes una reserva o postulación activa para el rango de fechas solicitado.' });
                }
            }

            // Create all options
            const createdReservations = [];
            for (const resData of reservationsToCreate) {
                const r = await prisma.reservation.create({
                    data: resData
                });
                createdReservations.push(r);

                // System log
                await prisma.systemLog.create({
                    data: {
                        user_id: userId!,
                        action: 'create_reservation_estival',
                        entity_type: 'Reservation',
                        entity_id: r.id,
                        details: `Postulación estival (Opción ${r.priority}) creada para usuario ${user.nombre} ${user.apellido} en sede ID ${r.location_id} del ${r.start_date.toISOString().split('T')[0]} al ${r.end_date.toISOString().split('T')[0]}.`
                    }
                });

                // Reservation history
                await prisma.reservationHistory.create({
                    data: {
                        reservation_id: r.id,
                        changed_by: userId!,
                        new_status: 'pendiente',
                        comments: `Postulación estival (Opción ${r.priority}) recibida`
                    }
                });
            }

            // Send confirmation email (just one for the application)
            if (createdReservations.length > 0) {
                sendReservationCreatedEmail(
                    user.correo,
                    user.nombre,
                    createdReservations[0].start_date,
                    createdReservations[createdReservations.length - 1].end_date
                ).catch(err => {
                    console.error('Error enviando email de postulación estival:', err);
                });
            }

            return res.status(201).json({
                message: 'Postulación estival recibida exitosamente',
                reservations: createdReservations
            });
        }

        // --- NORMAL SEASON RESERVATION ---
        const { cabin_id, start_date, end_date, occupants } = req.body;

        if (!cabin_id || !start_date || !end_date || occupants === undefined) {
            return res.status(400).json({ error: 'Faltan datos de la reserva' });
        }

        const occ = parseInt(occupants, 10);
        if (isNaN(occ) || occ < 1) {
            return res.status(400).json({ error: 'El mínimo de ocupantes es 1' });
        }
        if (occ > 6) {
            return res.status(400).json({ error: 'La cantidad máxima de ocupantes permitida es 6, incluyendo al solicitante.' });
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

        // Check if the requested range overlaps with any EstivalPeriod
        const overlappingEstival = await prisma.estivalPeriod.findFirst({
            where: {
                start_date: { lt: end },
                end_date: { gt: start }
            }
        });

        if (overlappingEstival) {
            return res.status(400).json({ 
                error: 'Las fechas seleccionadas corresponden al período estival. Para reservar en estas fechas debe realizar una postulación estival.' 
            });
        }

        // Check anticipation rules
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        const anticipationLimit = user.jerarquia === 'RET' ? 45 : 60;
        const targetMonday = getMondayOfWeek(start);
        const limitDiffTime = targetMonday.getTime() - today.getTime();
        const limitDiffDays = Math.ceil(limitDiffTime / (1000 * 60 * 60 * 24));

        if (limitDiffDays > anticipationLimit) {
            return res.status(400).json({ 
                error: `Como usuario ${user.jerarquia === 'RET' ? 'Retirado' : 'Activo'}, solo puedes reservar con hasta ${anticipationLimit} días de anticipación contados desde el primer lunes de la semana solicitada.` 
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

        // Automatically cancel sibling options if this was a cancelled estival option
        if (reservation.application_group) {
            const siblings = await prisma.reservation.findMany({
                where: {
                    application_group: reservation.application_group,
                    id: { not: id },
                    status: { in: ['pendiente', 'aprobada'] }
                }
            });

            for (const sibling of siblings) {
                await prisma.reservation.update({
                    where: { id: sibling.id },
                    data: {
                        status: 'cancelada',
                        comments: `Cancelación automática por anulación de postulación estival: ${comments}`
                    }
                });

                await prisma.reservationHistory.create({
                    data: {
                        reservation_id: sibling.id,
                        changed_by: userId as string,
                        old_status: sibling.status,
                        new_status: 'cancelada',
                        comments: `Cancelación automática por anulación de postulación estival: ${comments}`
                    }
                });

                await prisma.systemLog.create({
                    data: {
                        user_id: userId as string,
                        action: 'cancel_reservation',
                        entity_type: 'Reservation',
                        entity_id: sibling.id,
                        details: `Cancelación automática de opción alternativa (Opción ${sibling.priority}) debido a la cancelación de la solicitud principal por el usuario.`
                    }
                });
            }
        }

        // Notify Admins
        const admins = await prisma.user.findMany({ where: { role: 'admin_biena', status: 'aprobado' } });
        const adminEmails = admins.map(a => a.correo);
        
        const { sendAdminReservationCancelledEmail } = await import('../services/emailService');
        sendAdminReservationCancelledEmail(
            adminEmails, 
            `${reservation.user.nombre} ${reservation.user.apellido}`, 
            reservation.cabin?.identifier || 'Postulación Estival (Sin cabaña asignada)', 
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
                },
                location: true
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
        const limitHours = estival ? 96 : 48;

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
        const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
        const totalCount = await prisma.reservation.count();

        const reservations = await prisma.reservation.findMany({
            include: {
                user: { select: { id: true, nombre: true, apellido: true, cedula: true, legajo: true, jerarquia: true, correo: true, telefono: true, role: true, status: true } },
                cabin: { include: { location: true } },
                location: true
            },
            orderBy: { created_at: 'desc' },
            ...(limit && !isNaN(limit) ? { take: limit } : {})
        });

        res.setHeader('X-Total-Count', totalCount.toString());
        res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');
        res.json(reservations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error listando reservaciones.' });
    }
};

export const updateReservationStatus = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { status, comments, cabin_id, start_date, end_date } = req.body;
        const adminId = req.user?.id as string;

        if (!['aprobada', 'rechazada', 'cancelada', 'pendiente'].includes(status)) {
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

        const targetStartDate = start_date ? new Date(start_date) : reservation.start_date;
        const targetEndDate = end_date ? new Date(end_date) : reservation.end_date;

        // Estival approval validation and assignment
        let assignedCabinId = reservation.cabin_id;
        if (status === 'pendiente') {
            assignedCabinId = null;
        } else if (status === 'aprobada') {
            if (req.body.hasOwnProperty('cabin_id')) {
                const targetCabinId = req.body.cabin_id;
                if (targetCabinId) {
                    // Verify cabin exists and belongs to the requested location
                    const cabin = await prisma.cabin.findUnique({
                        where: { id: targetCabinId },
                        include: { location: true }
                    });
                    if (!cabin) {
                        return res.status(404).json({ error: 'La cabaña seleccionada no existe.' });
                    }
                    if (cabin.location_id !== reservation.location_id && reservation.location_id !== null) {
                        return res.status(400).json({ error: 'La cabaña seleccionada no pertenece a la sede solicitada.' });
                    }

                    // Verify cabin availability for the dates
                    const overlappingCabinRes = await prisma.reservation.findFirst({
                        where: {
                            id: { not: id },
                            cabin_id: targetCabinId,
                            status: 'aprobada',
                            start_date: { lt: targetEndDate },
                            end_date: { gt: targetStartDate }
                        }
                    });
                    if (overlappingCabinRes) {
                        return res.status(400).json({ error: 'La cabaña seleccionada ya está ocupada en esas fechas.' });
                    }

                    const overlappingBlocked = await prisma.blockedDate.findFirst({
                        where: {
                            OR: [
                                { cabin_id: targetCabinId },
                                { cabin_id: null }
                            ],
                            start_date: { lt: targetEndDate },
                            end_date: { gt: targetStartDate }
                        }
                    });
                    if (overlappingBlocked) {
                        return res.status(400).json({ error: 'La cabaña seleccionada tiene un bloqueo administrativo en esas fechas.' });
                    }

                    assignedCabinId = targetCabinId;
                } else {
                    // cabin_id is explicitly null -> Approved as SUPLENTE (no cabin assigned)
                    assignedCabinId = null;
                }
            }
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

            const limitHours = estival ? 96 : 48;
            const diffHours = (start.getTime() - today.getTime()) / (1000 * 60 * 60);

            if (diffHours < limitHours) {
                console.log(`Cancelación tardía (${diffHours.toFixed(1)}h < ${limitHours}h).`);
            }
        }

        const updated = await prisma.reservation.update({
            where: { id },
            data: { 
                status,
                cabin_id: assignedCabinId,
                start_date: start_date ? new Date(start_date) : undefined,
                end_date: end_date ? new Date(end_date) : undefined,
                comments: comments || (status === 'cancelada' ? 'Cancelada por el usuario' : null)
            },
            include: { cabin: { include: { location: true } } }
        });

        // Automatically reject sibling options if this was an approved estival option
        if (status === 'aprobada' && reservation.application_group) {
            const siblingReservations = await prisma.reservation.findMany({
                where: {
                    application_group: reservation.application_group,
                    id: { not: id },
                    status: 'pendiente'
                }
            });

            for (const sibling of siblingReservations) {
                await prisma.reservation.update({
                    where: { id: sibling.id },
                    data: {
                        status: 'rechazada',
                        comments: 'Opción alternativa aprobada'
                    }
                });

                await prisma.reservationHistory.create({
                    data: {
                        reservation_id: sibling.id,
                        changed_by: adminId,
                        old_status: sibling.status,
                        new_status: 'rechazada',
                        comments: 'Opción alternativa aprobada'
                    }
                });

                await prisma.systemLog.create({
                    data: {
                        user_id: adminId,
                        action: 'update_reservation_status',
                        entity_type: 'Reservation',
                        entity_id: sibling.id,
                        details: `Rechazo automático de la postulación alternativa (Opción ${sibling.priority}) por aprobación de opción ${reservation.priority}.`
                    }
                });
            }
        }

        // Automatically restore sibling options to pending if this was changed back to pending
        if (status === 'pendiente' && reservation.application_group) {
            const siblingReservations = await prisma.reservation.findMany({
                where: {
                    application_group: reservation.application_group,
                    id: { not: id },
                    status: 'rechazada',
                    comments: 'Opción alternativa aprobada'
                }
            });

            for (const sibling of siblingReservations) {
                await prisma.reservation.update({
                    where: { id: sibling.id },
                    data: {
                        status: 'pendiente',
                        comments: null
                    }
                });

                await prisma.reservationHistory.create({
                    data: {
                        reservation_id: sibling.id,
                        changed_by: adminId,
                        old_status: sibling.status,
                        new_status: 'pendiente',
                        comments: 'Opción alternativa restablecida por cambios en la adjudicación'
                    }
                });

                await prisma.systemLog.create({
                    data: {
                        user_id: adminId,
                        action: 'update_reservation_status',
                        entity_type: 'Reservation',
                        entity_id: sibling.id,
                        details: `Restablecimiento automático de la postulación alternativa (Opción ${sibling.priority}) por reversión a pendiente de la opción ${reservation.priority}.`
                    }
                });
            }
        }

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
                details: `El administrador ${admin?.nombre} ${admin?.apellido} cambió el estado de la reserva ID ${id} (Cabaña: ${updated.cabin?.identifier || 'Sin asignar'}) de ${reservation.status} a ${status}.`
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
        if (reservation.application_group) {
            const siblings = await prisma.reservation.findMany({
                where: { application_group: reservation.application_group }
            });
            const siblingIds = siblings.map(s => s.id);

            await prisma.reservationHistory.deleteMany({
                where: { reservation_id: { in: siblingIds } }
            });
            await prisma.reservation.deleteMany({
                where: { application_group: reservation.application_group }
            });

            await prisma.systemLog.create({
                data: {
                    user_id: adminId,
                    action: 'delete_reservation_group',
                    entity_type: 'Reservation',
                    entity_id: reservation.application_group,
                    details: `Grupo de postulación estival eliminado por SuperAdmin (Grupo: ${reservation.application_group}, IDs: ${siblingIds.join(', ')})`
                }
            });
        } else {
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
        }

        res.json({ message: 'Reserva eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar la reserva' });
    }
};
