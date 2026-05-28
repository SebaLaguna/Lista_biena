import { Router } from 'express';
import { getLocationsWithCabins } from '../controllers/cabinController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Endpoint puede ser público o protegido, por seguridad de las reglas institucionales se protege
router.get('/', authenticate, getLocationsWithCabins);

export default router;
