import { Router } from 'express';
import {
  register,
  login,
  getMe,
  inviteAdmin,
  acceptAdminInvite,
  sendVerificationEmail,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  deleteAccount,
} from '../controllers/authController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public routes (with brute-force rate limiter)
router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/accept-invite', authRateLimiter, acceptAdminInvite);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);
router.post('/verify-email', verifyEmail);

// Protected routes (Logged in user)
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);
router.post('/change-password', authenticateToken, changePassword);
router.delete('/account', authenticateToken, deleteAccount);
router.post('/send-verification', authenticateToken, sendVerificationEmail);

// Admin-Only routes (Protected with requireAdmin)
router.post('/invite-admin', authenticateToken, requireAdmin, inviteAdmin);

export default router;
