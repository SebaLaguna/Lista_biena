import { Router } from 'express';
import {
    checkAvailability,
    createReservation,
    getMyReservations,
    getAdminReservations,
    updateReservationStatus,
    getUserHistory
} from '../controllers/reservationController';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Rutas de Usuario
router.get('/availability', authenticate, checkAvailability);
router.post('/', authenticate, createReservation);
router.get('/me', authenticate, getMyReservations);

// Rutas de Administrador
router.get('/admin', authenticate, requireAdmin, getAdminReservations);
router.put('/admin/:id/status', authenticate, requireAdmin, updateReservationStatus);
router.get('/admin/user/:userId/history', authenticate, requireAdmin, getUserHistory);

export default router;
