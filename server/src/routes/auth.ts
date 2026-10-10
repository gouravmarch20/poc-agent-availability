import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { parseBody } from '../middleware/validate.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' },
});

const loginSchema = z.object({
  email: z.string().email().refine(
    (email) => email.toLowerCase().endsWith('@gmail.com')
      || (process.env.NODE_ENV !== 'production' && email.toLowerCase().endsWith('@local.test')),
    { message: 'Use a Gmail address' },
  ),
  password: z.string().min(5).max(128),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(8).max(128),
  newPassword: z.string().min(8).max(128),
});

router.post('/login', loginLimiter, parseBody(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.getCurrentUser);
router.post('/change-password', requireAuth, parseBody(passwordSchema), authController.changePassword);

export default router;
