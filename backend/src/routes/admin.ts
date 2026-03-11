import { Router } from 'express';
import {
    updateCabin,
    createCabin,
    deleteCabin,
    getLocations,
    createLocation,
    updateLocation,
    deleteLocation,
    getBlockedDates,
    createBlockedDate,
    deleteBlockedDate
} from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Sedes (Locations)
router.get('/locations', authenticate, requireAdmin, getLocations);
router.post('/locations', authenticate, requireAdmin, createLocation);
router.patch('/locations/:id', authenticate, requireAdmin, updateLocation);
router.delete('/locations/:id', authenticate, requireAdmin, deleteLocation);

// Cabañas (Cabins)
router.post('/cabins', authenticate, requireAdmin, createCabin);
router.patch('/cabins/:id', authenticate, requireAdmin, updateCabin);
router.delete('/cabins/:id', authenticate, requireAdmin, deleteCabin);

// Fechas bloqueadas
router.get('/blocked-dates', authenticate, requireAdmin, getBlockedDates);
router.post('/blocked-dates', authenticate, requireAdmin, createBlockedDate);
router.delete('/blocked-dates/:id', authenticate, requireAdmin, deleteBlockedDate);

export default router;
