import type { HydratedDocument } from 'mongoose';
import { AgentImageRecord, AgentRecord } from '../models/Agent.js';
import {
  createAgent,
  findAgentById,
  listAgents,
  saveAgent,
} from '../repositories/agents.repository.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { deleteFile, looksLikeImage, openDownload, putFile } from '../services/gridfs.js';
import { ALLOWED_IMAGE_TYPES, MAX_AGENT_IMAGES } from '../config.js';
import { staffRoles } from '../middleware/auth.js';

type PublicAgent = Omit<AgentRecord, 'images'> & {
  id: string;
  images: (AgentImageRecord & { url: string })[];
};

function publicAgent(agent: HydratedDocument<AgentRecord>): PublicAgent {
  const json = agent.toJSON() as unknown as PublicAgent;
  json.images = json.images.map((image) => ({
    ...image,
    url: `/api/agents/${json.id}/images/${image.fileId}`,
  }));
  return json;
}

export const list = asyncHandler(async (request, response) => {
  const includeDeleted = staffRoles.includes(request.user.role) && request.query.includeDeleted === 'true';
  const agents = await listAgents(includeDeleted);
  response.json({ agents: agents.map(publicAgent) });
});

export const getById = asyncHandler(async (request, response) => {
  const agent = await findAgentById(request.params.id);
  if (!agent || (agent.isDeleted && !staffRoles.includes(request.user.role))) {
    response.status(404).json({ error: 'Agent not found' });
    return;
  }
  response.json({ agent: publicAgent(agent) });
});

export const create = asyncHandler(async (request, response) => {
  const agent = await createAgent(request.body);
  response.status(201).json({ agent: publicAgent(agent) });
});

export const update = asyncHandler(async (request, response) => {
  const agent = await findAgentById(request.params.id);
  if (!agent || agent.isDeleted) {
    response.status(404).json({ error: 'Agent not found' });
    return;
  }
  Object.assign(agent, request.body);
  await saveAgent(agent);
  response.json({ agent: publicAgent(agent) });
});

export const remove = asyncHandler(async (request, response) => {
  const agent = await findAgentById(request.params.id);
  if (!agent || agent.isDeleted) {
    response.status(404).json({ error: 'Agent not found' });
    return;
  }
  agent.isDeleted = true;
  await saveAgent(agent);
  response.json({ ok: true });
});

export const getImage = asyncHandler(async (request, response) => {
  const agent = await findAgentById(request.params.id);
  if (!agent || (agent.isDeleted && !staffRoles.includes(request.user.role))) {
    response.status(404).json({ error: 'Agent not found' });
    return;
  }
  const image = agent.images.find((item) => String(item.fileId) === request.params.fileId);
  if (!image) {
    response.status(404).json({ error: 'Image not found' });
    return;
  }

  response.setHeader('Content-Type', image.contentType);
  response.setHeader('Cache-Control', 'private, max-age=3600');
  const stream = openDownload(image.fileId);
  stream.on('error', () => {
    if (!response.headersSent) response.status(404).json({ error: 'Image not found' });
  });
  stream.pipe(response);
});

export const uploadImages = asyncHandler(async (request, response) => {
  const agent = await findAgentById(request.params.id);
  if (!agent || agent.isDeleted) {
    response.status(404).json({ error: 'Agent not found' });
    return;
  }
  const files: Express.Multer.File[] = Array.isArray(request.files) ? request.files : [];
  if (!files.length) {
    response.status(400).json({ error: 'No images uploaded' });
    return;
  }
  if (agent.images.length + files.length > MAX_AGENT_IMAGES) {
    response.status(400).json({ error: `Maximum ${MAX_AGENT_IMAGES} images per agent` });
    return;
  }

  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype) || !looksLikeImage(file.buffer, file.mimetype)) {
      response.status(400).json({ error: 'Only JPEG, PNG and WebP images are allowed' });
      return;
    }
  }

  let order = agent.images.length;
  const hasCover = agent.images.some((image) => image.isCover);
  for (const [index, file] of files.entries()) {
    const fileId = await putFile({
      buffer: file.buffer,
      filename: file.originalname || 'image',
      contentType: file.mimetype,
    });
    agent.images.push({
      fileId,
      filename: file.originalname || 'image',
      contentType: file.mimetype,
      size: file.size,
      order,
      isCover: !hasCover && index === 0,
      uploadedAt: new Date(),
    });
    order += 1;
  }

  await saveAgent(agent);
  response.status(201).json({ agent: publicAgent(agent) });
});

export const deleteImage = asyncHandler(async (request, response) => {
  const agent = await findAgentById(request.params.id);
  if (!agent || agent.isDeleted) {
    response.status(404).json({ error: 'Agent not found' });
    return;
  }
  const index = agent.images.findIndex((image) => String(image.fileId) === request.params.fileId);
  if (index < 0) {
    response.status(404).json({ error: 'Image not found' });
    return;
  }
  const [removed] = agent.images.splice(index, 1);
  if (!removed) {
    response.status(404).json({ error: 'Image not found' });
    return;
  }
  await deleteFile(removed.fileId);
  if (removed.isCover && agent.images.length) agent.images[0].isCover = true;
  agent.images.forEach((image, imageIndex) => {
    image.order = imageIndex;
  });
  await saveAgent(agent);
  response.json({ agent: publicAgent(agent) });
});

export const reorderImages = asyncHandler(async (request, response) => {
  const agent = await findAgentById(request.params.id);
  if (!agent || agent.isDeleted) {
    response.status(404).json({ error: 'Agent not found' });
    return;
  }
  const byId = new Map(agent.images.map((image) => [String(image.fileId), image]));
  const nextImages = [];
  for (const item of request.body.images) {
    const existing = byId.get(item.fileId);
    if (!existing) {
      response.status(400).json({ error: 'Unknown image in reorder payload' });
      return;
    }
    existing.order = item.order;
    existing.isCover = Boolean(item.isCover);
    nextImages.push(existing);
  }
  if (nextImages.length !== agent.images.length) {
    response.status(400).json({ error: 'Reorder payload must include all images' });
    return;
  }
  const covers = nextImages.filter((image) => image.isCover);
  if (covers.length !== 1 && nextImages.length > 0) {
    response.status(400).json({ error: 'Exactly one cover image is required' });
    return;
  }
  agent.images.splice(0, agent.images.length, ...nextImages.sort((left, right) => left.order - right.order));
  await saveAgent(agent);
  response.json({ agent: publicAgent(agent) });
});