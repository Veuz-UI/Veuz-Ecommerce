import { Router } from 'express';
import {
  getUsers,
  createUser,
  toggleBlockUser,
  resetUserPassword,
  deleteUser,
} from '../controllers/adminUserController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// All routes here require valid token and admin role
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', getUsers);
router.post('/', createUser);
router.patch('/:id/block', toggleBlockUser);
router.post('/:id/reset-password', resetUserPassword);
router.delete('/:id', deleteUser);

export default router;
