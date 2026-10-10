import { Router } from 'express';
import { z } from 'zod';
import * as availabilityController from '../controllers/availability.controller.js';
import { requireAuth, requireRole, staffRoles } from '../middleware/auth.js';
import { parseBody, parseQuery } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

const slotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  agentId: z.string().min(1),
  startTime: z.string(),
  endTime: z.string(),
});

const rangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  date: z.string().optional(),
});

router.get('/', parseQuery(rangeSchema), availabilityController.list);
router.get('/upcoming', availabilityController.upcoming);
router.post('/', requireRole(...staffRoles), parseBody(slotSchema), availabilityController.assign);
router.patch('/:id', requireRole(...staffRoles), parseBody(slotSchema.partial()), availabilityController.update);
router.delete('/:id', requireRole(...staffRoles), availabilityController.remove);

export default router;
