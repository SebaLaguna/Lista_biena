import { Router } from 'express';
import {
    checkAvailability,
    createReservation,
    getMyReservations,
    getAdminReservations,
    updateReservationStatus,
    getUserHistory,
    deleteReservation,
    cancelMyReservation,
    getPublicEstivalPeriods
} from '../controllers/reservationController';
import { authenticate, requireAdmin, requireSuperAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Rutas de Usuario
router.get('/estival-periods', authenticate, getPublicEstivalPeriods);
router.get('/availability', authenticate, checkAvailability);
router.post('/', authenticate, createReservation);
router.get('/me', authenticate, getMyReservations);
router.put('/:id/cancel', authenticate, cancelMyReservation);

// Rutas de Administrador
router.get('/admin', authenticate, requireAdmin, getAdminReservations);
router.put('/admin/:id/status', authenticate, requireAdmin, updateReservationStatus);
router.get('/admin/user/:userId/history', authenticate, requireAdmin, getUserHistory);

// Rutas exclusivas de SuperAdmin
router.delete('/admin/:id', authenticate, requireSuperAdmin, deleteReservation);

export default router;
