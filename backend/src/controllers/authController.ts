import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto_armada_2026';

export const register = async (req: Request, res: Response) => {
    try {
        const { nombre, apellido, cedula, legajo, correo, telefono, password } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ cedula }, { legajo }, { correo }]
            }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Ya existe un usuario con esa cédula, legajo o correo.' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                nombre,
                apellido,
                cedula,
                legajo,
                correo,
                telefono,
                password_hash
            }
        });

        res.status(201).json({ message: 'Usuario registrado exitosamente', userId: newUser.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar el usuario.' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { correo, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { correo }
        });

        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
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
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al iniciar sesión.' });
    }
};
