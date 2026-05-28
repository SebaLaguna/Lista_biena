import { Router } from 'express';
import { getProfile, updateProfile, getUsers, updateUserStatus, updateUserRole, deleteUser, resetUserPassword } from '../controllers/userController';
import { authenticate, requireAdmin, requireSuperAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Rutas de perfil personal
router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, updateProfile);

// Rutas administrativas (BIENA y SuperAdmin)
router.get('/', authenticate, requireAdmin, getUsers);
router.patch('/:id/status', authenticate, requireAdmin, updateUserStatus);

// Rutas exclusivas SuperAdmin
router.patch('/:id/role', authenticate, requireSuperAdmin, updateUserRole);
router.delete('/:id', authenticate, requireSuperAdmin, deleteUser);
router.put('/:id/reset-password', authenticate, requireSuperAdmin, resetUserPassword);

export default router;
