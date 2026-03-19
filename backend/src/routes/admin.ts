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
    deleteBlockedDate,
    getEstivalPeriods,
    createEstivalPeriod,
    updateEstivalPeriod,
    deleteEstivalPeriod,
    getAdminStats
} from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Stats
router.get('/stats', authenticate, requireAdmin, getAdminStats);

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

// Periodos estivales
router.get('/estival-periods', authenticate, requireAdmin, getEstivalPeriods);
router.post('/estival-periods', authenticate, requireAdmin, createEstivalPeriod);
router.put('/estival-periods/:id', authenticate, requireAdmin, updateEstivalPeriod);
router.delete('/estival-periods/:id', authenticate, requireAdmin, deleteEstivalPeriod);

export default router;
