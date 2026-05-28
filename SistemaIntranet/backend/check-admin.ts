
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkAdmin() {
    try {
        const user = await prisma.user.findUnique({
            where: { correo: 'admin@armada.mil.uy' }
        });

        if (!user) {
            console.log('Admin user not found!');
            return;
        }

        console.log('User found:', {
            id: user.id,
            correo: user.correo,
            jerarquia: user.jerarquia,
            status: user.status,
            role: user.role
        });

        const isMatch = await bcrypt.compare('admin123', user.password_hash);
        console.log('Password match (admin123):', isMatch);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdmin();
