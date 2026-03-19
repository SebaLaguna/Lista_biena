import { Response, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendUserStatusUpdatedEmail } from '../services/emailService';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                nombre: true,
                apellido: true,
                cedula: true,
                legajo: true,
                jerarquia: true,
                correo: true,
                telefono: true,
                status: true,
                role: true,
                created_at: true,
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
    try {
        // Obtenemos a todos los usuarios
        const users = await prisma.user.findMany({
            select: {
                id: true,
                nombre: true,
                apellido: true,
                cedula: true,
                legajo: true,
                correo: true,
                telefono: true,
                role: true,
                jerarquia: true,
                status: true,
                created_at: true
            },
            orderBy: { created_at: 'desc' }
        });

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
};

export const updateUserStatus = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { status } = req.body;
        const adminId = req.user?.id;

        if (!['pendiente', 'aprobado', 'inactivo'].includes(status)) {
            return res.status(400).json({ error: 'Estado inválido' });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { status }
        });

        await prisma.systemLog.create({
            data: {
                user_id: adminId,
                action: 'update_user_status',
                entity_type: 'User',
                entity_id: id,
                details: `Usuario ${updatedUser.correo} cambió a estado ${status}`
            }
        });

        sendUserStatusUpdatedEmail(updatedUser.correo, updatedUser.nombre, updatedUser.status).catch(err => {
            console.error('Error enviando email de estado de usuario en el background:', err);
        });

        res.json({ message: 'Estado del usuario actualizado exitosamente', user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el estado del usuario' });
    }
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { role } = req.body;
        const adminId = req.user?.id;

        if (!['common_user', 'super_admin', 'admin_biena'].includes(role)) {
            return res.status(400).json({ error: 'Rol inválido' });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { role }
        });

        await prisma.systemLog.create({
            data: {
                user_id: adminId,
                action: 'update_user_role',
                entity_type: 'User',
                entity_id: id,
                details: `Usuario ${updatedUser.correo} cambió a rol ${role}`
            }
        });

        res.json({ message: 'Rol del usuario actualizado exitosamente', user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el rol del usuario' });
    }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const adminId = req.user?.id;

        const user = await prisma.user.findUnique({ where: { id } });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Primero eliminar referencias si es necesario o marcar como inactivo
        // Por seguridad, vamos a usar una baja lógica o eliminar. En este caso eliminaremos.
        await prisma.user.delete({ where: { id } });

        await prisma.systemLog.create({
            data: {
                user_id: adminId,
                action: 'delete_user',
                entity_type: 'User',
                entity_id: id,
                details: `Usuario eliminado: ${user.correo}`
            }
        });

        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar usuario. Puede que tenga reservas asociadas.' });
    }
};

export const resetUserPassword = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { newPassword } = req.body;
        const adminId = req.user?.id;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id },
            data: { password_hash: hashedPassword }
        });

        await prisma.systemLog.create({
            data: {
                user_id: adminId,
                action: 'reset_user_password',
                entity_type: 'User',
                entity_id: id,
                details: `Contraseña reestablecida manualmente para el usuario: ${user.correo}`
            }
        });

        res.json({ message: 'Contraseña actualizada exitosamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al reestablecer la contraseña.' });
    }
};
