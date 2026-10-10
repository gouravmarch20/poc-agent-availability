import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import * as agentsController from '../controllers/agents.controller.js';
import { requireAuth, requireRole, staffRoles } from '../middleware/auth.js';
import { parseBody } from '../middleware/validate.js';
import {
  DEFAULT_CURRENCY,
  MAX_AGENT_IMAGES,
  MAX_IMAGE_BYTES,
} from '../config.js';

const router = Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: MAX_AGENT_IMAGES },
});

const agentSchema = z.object({
  name: z.string().min(1).max(80),
  phone: z.string().min(5).max(20),
  address: z.string().max(300).optional().default(''),
  badges: z.array(z.string().min(1).max(40)).max(20).optional().default([]),
  pricing: z.object({
    amount: z.number().min(0),
    currency: z.string().min(3).max(6).optional().default(DEFAULT_CURRENCY),
  }),
});

const updateSchema = agentSchema.partial();

const reorderSchema = z.object({
  images: z
    .array(
      z.object({
        fileId: z.string(),
        order: z.number().int().min(0).max(MAX_AGENT_IMAGES - 1),
        isCover: z.boolean().optional(),
      })
    )
    .max(MAX_AGENT_IMAGES),
});

router.get('/', agentsController.list);

router.get('/:id', agentsController.getById);

router.post('/', requireRole(...staffRoles), parseBody(agentSchema), agentsController.create);

router.patch('/:id', requireRole(...staffRoles), parseBody(updateSchema), agentsController.update);

router.delete('/:id', requireRole(...staffRoles), agentsController.remove);

router.get('/:id/images/:fileId', agentsController.getImage);

router.post(
  '/:id/images',
  requireRole(...staffRoles),
  upload.array('images', MAX_AGENT_IMAGES),
  agentsController.uploadImages
);

router.delete('/:id/images/:fileId', requireRole(...staffRoles), agentsController.deleteImage);

router.patch('/:id/images', requireRole(...staffRoles), parseBody(reorderSchema), agentsController.reorderImages);

export default router;
