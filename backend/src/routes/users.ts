import { Router } from 'express';
import { getProfile } from '../controllers/userController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.get('/profile', authenticate, getProfile);

export default router;
