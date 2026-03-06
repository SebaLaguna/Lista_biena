import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import cabinRoutes from './routes/cabins';
import reservationRoutes from './routes/reservations';

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cabins', cabinRoutes);
app.use('/api/reservations', reservationRoutes);

// Routes will be mounted here
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API is running' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
