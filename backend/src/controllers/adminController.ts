import { Response, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';

const prisma = new PrismaClient();

export const getAdminStats = async (req: AuthRequest, res: Response) => {
    try {
        const pendingReservations = await prisma.reservation.findMany({
            where: { status: 'pendiente' },
            select: { id: true }
        });
        
        const cancelledReservations = await prisma.reservation.findMany({
            where: { status: 'cancelada' },
            select: { id: true }
        });

        const pendingUsers = await prisma.user.findMany({
            where: { status: 'pendiente' },
            select: { id: true }
        });

        res.json({
            pendingReservationIds: pendingReservations.map(r => r.id),
            cancelledReservationIds: cancelledReservations.map(r => r.id),
            pendingUserIds: pendingUsers.map(u => u.id)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener estadísticas.' });
    }
};

// === LOCATIONS ===
export const getLocations = async (req: AuthRequest, res: Response) => {
    try {
        const locations = await prisma.location.findMany({
            include: { cabins: true },
            orderBy: { name: 'asc' }
        });
        res.json(locations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener sedes.' });
    }
};

export const createLocation = async (req: AuthRequest, res: Response) => {
    try {
        const { name, description } = req.body;
        const adminId = req.user?.id;

        const location = await prisma.location.create({
            data: { name, description }
        });

        await prisma.systemLog.create({
            data: {
                user_id: adminId,
                action: 'create_location',
                entity_type: 'Location',
                entity_id: location.id,
                details: `Sede creada: ${name}`
            }
        });

        res.status(201).json(location);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Ya existe una sede con ese nombre.' });
        }
        console.error(error);
        res.status(500).json({ error: 'Error al crear sede.' });
    }
};

export const updateLocation = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name, description } = req.body;
        const adminId = req.user?.id;

        const location = await prisma.location.update({
            where: { id },
            data: { name, description }
        });

        await prisma.systemLog.create({
            data: {
                user_id: adminId,
                action: 'update_location',
                entity_type: 'Location',
                entity_id: location.id,
                details: `Sede actualizada: ${name}`
            }
        });

        res.json(location);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar sede.' });
    }
};

export const deleteLocation = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const adminId = req.user?.id;

        // Check if has cabins
        const cabinsCount = await prisma.cabin.count({ where: { location_id: id } });
        if (cabinsCount > 0) {
            return res.status(400).json({ error: 'No se puede eliminar una sede que tiene cabañas asociadas.' });
        }

        const location = await prisma.location.delete({ where: { id } });

        await prisma.systemLog.create({
            data: {
                user_id: adminId,
                action: 'delete_location',
                entity_type: 'Location',
                entity_id: id,
                details: `Sede eliminada: ${location.name}`
            }
        });

        res.json({ message: 'Sede eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar sede.' });
    }
};

// === CABINS ===
export const createCabin = async (req: AuthRequest, res: Response) => {
    try {
        const { location_id, identifier, capacity, status, allowed_hierarchies } = req.body;
        const adminId = req.user?.id;

        const cabin = await prisma.cabin.create({
            data: {
                location_id,
                identifier,
                capacity: capacity ? parseInt(capacity, 10) : null,
                status: status || 'disponible',
                allowed_hierarchies: allowed_hierarchies || null
            },
            include: { location: true }
        });

        await prisma.systemLog.create({
            data: {
                user_id: adminId,
                action: 'create_cabin',
                entity_type: 'Cabin',
                entity_id: cabin.id,
                details: `Cabaña creada: ${identifier} en sede ${cabin.location.name}. Jerarquías permitidas: ${allowed_hierarchies ? JSON.stringify(allowed_hierarchies) : 'Todas'}`
            }
        });

        res.status(201).json(cabin);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Ya existe una cabaña con ese identificador.' });
        }
        console.error(error);
        res.status(500).json({ error: 'Error al crear cabaña.' });
    }
};

export const updateCabin = async (req: AuthRequest, res: Response) => {
    try {
        const cabinId = req.params.id as string;
        const { identifier, capacity, status, allowed_hierarchies } = req.body;
        const adminId = req.user?.id;

        const cabin = await prisma.cabin.update({
            where: { id: cabinId },
            data: {
                identifier,
                capacity: capacity ? parseInt(capacity, 10) : null,
                status,
                allowed_hierarchies: allowed_hierarchies || null
            },
            include: { location: true }
        });

        await prisma.systemLog.create({
            data: {
                user_id: adminId,
                action: 'update_cabin',
                entity_type: 'Cabin',
                entity_id: cabin.id,
                details: `Cabaña ${identifier} editada en ${cabin.location.name}. Estado: ${status}, Capacidad: ${capacity}, Jerarquías: ${allowed_hierarchies ? JSON.stringify(allowed_hierarchies) : 'Todas'}`
            }
        });

        res.json({ message: 'Cabaña actualizada', cabin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar cabaña.' });
    }
};

export const deleteCabin = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const adminId = req.user?.id;

        const cabin = await prisma.cabin.findUnique({ where: { id }, include: { location: true } });
        if (!cabin) return res.status(404).json({ error: 'Cabaña no encontrada' });

        // Check if has reservations
        const resCount = await prisma.reservation.count({ where: { cabin_id: id } });
        if (resCount > 0) {
            return res.status(400).json({ error: 'No se puede eliminar una cabaña que tiene reservas registradas.' });
        }

        await prisma.cabin.delete({ where: { id } });

        await prisma.systemLog.create({
            data: {
                user_id: adminId,
                action: 'delete_cabin',
                entity_type: 'Cabin',
                entity_id: id,
                details: `Cabaña eliminada: ${cabin.identifier} - Sede: ${cabin.location.name}`
            }
        });

        res.json({ message: 'Cabaña eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar cabaña.' });
    }
};

// === BLOCKED DATES ===
export const getBlockedDates = async (req: AuthRequest, res: Response) => {
    try {
        const blocked = await prisma.blockedDate.findMany({
            include: { cabin: { include: { location: true } } },
            orderBy: { start_date: 'desc' }
        });
        res.json(blocked);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener fechas bloqueadas' });
    }
};

export const createBlockedDate = async (req: AuthRequest, res: Response) => {
    try {
        const { cabin_id, start_date, end_date, reason } = req.body;
        const adminId = req.user?.id;

        const start = new Date(start_date);
        const end = new Date(end_date);

        const blockedDate = await prisma.blockedDate.create({
            data: {
                cabin_id: cabin_id || null, 
                start_date: start,
                end_date: end,
                reason
            },
            include: { cabin: true }
        });

        await prisma.systemLog.create({
            data: {
                user_id: adminId,
                action: 'create_blocked_date',
                entity_type: 'BlockedDate',
                entity_id: blockedDate.id,
                details: `Bloqueo ${cabin_id ? `de cabaña ${blockedDate.cabin?.identifier}` : 'global'} del ${start_date} al ${end_date}. Razón: ${reason}`
            }
        });

        res.status(201).json({ message: 'Bloqueo creado exitosamente', blockedDate });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear bloqueo' });
    }
};

export const deleteBlockedDate = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const adminId = req.user?.id;

        const blockedDate = await prisma.blockedDate.delete({
            where: { id },
            include: { cabin: true }
        });

        await prisma.systemLog.create({
            data: {
                user_id: adminId,
                action: 'delete_blocked_date',
                entity_type: 'BlockedDate',
                entity_id: id,
                details: `Bloqueo eliminado ${blockedDate.cabin ? `para cabaña ${blockedDate.cabin.identifier}` : 'global'}`
            }
        });

        res.json({ message: 'Bloqueo eliminado', blockedDate });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar bloqueo' });
    }
};

// === ESTIVAL PERIODS ===
export const getEstivalPeriods = async (req: Request, res: Response) => {
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

export const createEstivalPeriod = async (req: AuthRequest, res: Response) => {
    try {
        const { start_date, end_date, description } = req.body;
        const adminId = req.user?.id;

        const period = await prisma.estivalPeriod.create({
            data: {
                start_date: new Date(start_date),
                end_date: new Date(end_date),
                description
            }
        });

        await prisma.systemLog.create({
            data: {
                user_id: adminId,
                action: 'create_estival_period',
                entity_type: 'EstivalPeriod',
                entity_id: period.id,
                details: `Periodo estival creado: ${start_date} al ${end_date}. Descripción: ${description || 'N/A'}`
            }
        });

        res.status(201).json(period);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear periodo estival.' });
    }
};

export const deleteEstivalPeriod = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const adminId = req.user?.id;

        await prisma.estivalPeriod.delete({ where: { id } });

        await prisma.systemLog.create({
            data: {
                user_id: adminId,
                action: 'delete_estival_period',
                entity_type: 'EstivalPeriod',
                entity_id: id,
                details: `Periodo estival eliminado.`
            }
        });

        res.json({ message: 'Periodo estival eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar periodo estival.' });
    }
};

export const updateEstivalPeriod = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { start_date, end_date, description } = req.body;
        const adminId = req.user?.id;

        const period = await prisma.estivalPeriod.update({
            where: { id },
            data: {
                start_date: new Date(start_date),
                end_date: new Date(end_date),
                description
            }
        });

        await prisma.systemLog.create({
            data: {
                user_id: adminId,
                action: 'update_estival_period',
                entity_type: 'EstivalPeriod',
                entity_id: period.id,
                details: `Periodo estival actualizado: ${start_date} al ${end_date}. Descripción: ${description || 'N/A'}`
            }
        });

        res.json(period);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar periodo estival.' });
    }
};
