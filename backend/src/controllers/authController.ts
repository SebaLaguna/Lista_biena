import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { sendRegistrationReceivedEmail } from '../services/emailService';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto_armada_2026';

export const register = async (req: Request, res: Response) => {
    try {
        const { nombre, apellido, cedula, legajo, jerarquia, correo: rawCorreo, telefono, password } = req.body;
        const correo = rawCorreo.toLowerCase();

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ cedula }, { legajo }, { correo }]
            }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Ya existe un usuario con esa cédula, legajo/matrícula o correo.' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                nombre,
                apellido,
                cedula,
                legajo,
                jerarquia: jerarquia as any,
                correo,
                telefono,
                password_hash: await bcrypt.hash(password, 10),
                status: 'pendiente' // Asegurar estado pendiente
            }
        });

        // Send email asynchronously without blocking the response
        sendRegistrationReceivedEmail(newUser.correo, newUser.nombre).catch(err => {
            console.error('Error enviando email en el background:', err);
        });

        res.status(201).json({ message: 'Usuario registrado exitosamente. Su cuenta está pendiente de aprobación.', userId: newUser.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar el usuario.' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { correo: rawCorreo, password } = req.body;
        const correo = rawCorreo.toLowerCase();

        const user = await prisma.user.findUnique({
            where: { correo }
        });

        if (!user) {
            console.warn(`[Login Failed] Usuario no encontrado: ${correo}`);
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            console.warn(`[Login Failed] Contraseña incorrecta para: ${correo}`);
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        if (user.status === 'pendiente') {
            console.warn(`[Login Failed] Usuario pendiente de aprobación: ${correo}`);
            return res.status(403).json({ error: 'Tu cuenta está pendiente de aprobación por parte de BIENA.' });
        }

        if (user.status === 'inactivo') {
            return res.status(403).json({ error: 'Tu cuenta ha sido desactivada.' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, correo: user.correo, nombre: user.nombre, apellido: user.apellido },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                apellido: user.apellido,
                correo: user.correo,
                role: user.role,
                jerarquia: user.jerarquia,
                status: user.status
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al iniciar sesión.' });
    }
};
