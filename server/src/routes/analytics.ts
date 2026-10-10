import { Router } from 'express';
import { z } from 'zod';
import * as analyticsController from '../controllers/analytics.controller.js';
import { requireAuth, requireRole, staffRoles } from '../middleware/auth.js';
import { parseBody } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

const viewSchema = z.object({
  path: z.string().min(1).max(200),
  type: z.enum(['page_view', 'session_start']).optional().default('page_view'),
});

router.post('/events', parseBody(viewSchema), analyticsController.trackEvent);
router.get('/stats', requireRole(...staffRoles), analyticsController.getStats);

export default router;
