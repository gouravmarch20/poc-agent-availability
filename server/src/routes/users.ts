import { Router } from 'express';
import { z } from 'zod';
import * as usersController from '../controllers/users.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { parseBody, parseQuery } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth, requireRole('superAdmin', 'admin'));

const createSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(['superAdmin', 'admin', 'agent', 'customer']),
  phone: z.string().max(20).optional().default(''),
  dob: z.string().max(12).optional().default(''),
  isActive: z.boolean().optional().default(true),
});

const updateSchema = createSchema.partial().omit({ password: true }).extend({
  password: z.string().min(8).max(128).optional(),
});

const searchSchema = z.object({
  q: z.string().optional().default(''),
  role: z.enum(['superAdmin', 'admin', 'agent', 'customer']).optional(),
});

router.get('/', parseQuery(searchSchema), usersController.list);
router.post('/', parseBody(createSchema), usersController.create);
router.patch('/:id', parseBody(updateSchema), usersController.update);

export default router;
