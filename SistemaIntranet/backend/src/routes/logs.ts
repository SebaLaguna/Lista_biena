import { Router } from 'express';
import { getSystemLogs } from '../controllers/logController';
import { authenticate, requireSuperAdmin } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticate, requireSuperAdmin, getSystemLogs);

export default router;
