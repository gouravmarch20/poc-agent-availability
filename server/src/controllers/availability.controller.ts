import type { HydratedDocument } from 'mongoose';
import { AgentRecord } from '../models/Agent.js';
import {
  createAvailability,
  deleteAvailability,
  findAvailabilityById,
  listAvailability,
  saveAvailability,
} from '../repositories/availability.repository.js';
import { findActiveAgentsByIds, findAgentById } from '../repositories/agents.repository.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { addDaysYmd, calendarDateYmd, isValidTime, normalizeTime, purgeAtFromDate, todayYmd } from '../utils/dates.js';
import { hasErrorCode } from '../utils/errors.js';
import { staffRoles } from '../middleware/auth.js';

function coverUrl(agent: HydratedDocument<AgentRecord>): string | null {
  const cover = agent.images.find((image) => image.isCover) || agent.images[0];
  return cover ? `/api/agents/${agent._id}/images/${cover.fileId}` : null;
}

export const list = asyncHandler(async (request, response) => {
  const from = calendarDateYmd(request.query.date || request.query.from || todayYmd());
  const to = calendarDateYmd(request.query.to || from);
  if (!from || !to) {
    response.status(400).json({ error: 'Invalid date' });
    return;
  }

  if (request.user.role === 'customer') {
    const earliestDate = addDaysYmd(todayYmd(), -1);
    const latestDate = addDaysYmd(todayYmd(), 1);
    if (from < earliestDate || to > latestDate) {
      response.status(403).json({ error: 'Customers can view availability from yesterday through tomorrow.' });
      return;
    }
  }

  const slots = await listAvailability(from, to);
  const agentIds = [...new Set(slots.map((slot) => String(slot.agentId)))];
  const agents = await findActiveAgentsByIds(agentIds);
  const agentsById = new Map(agents.map((agent) => [String(agent._id), agent]));
  const items = slots.flatMap((slot) => {
    const agent = agentsById.get(String(slot.agentId));
    if (!agent || (request.user.role === 'customer' && agent.images.length === 0)) return [];
    return [{
      ...slot.toJSON(),
      agent: {
        id: String(agent._id),
        name: agent.name,
        phone: agent.phone,
        address: agent.address,
        badges: agent.badges,
        pricing: agent.pricing,
        coverUrl: coverUrl(agent),
      },
    }];
  });
  response.json({ from, to, items });
});

export const upcoming = asyncHandler(async (request, response) => {
  const from = todayYmd();
  const to = addDaysYmd(from, 14);
  const slots = await listAvailability(from, to);
  const availableDates = [...new Set(slots.map((slot) => slot.date))];
  const dates = request.user.role === 'customer'
    ? availableDates.filter((date) => date >= addDaysYmd(from, -1) && date <= addDaysYmd(from, 1))
    : availableDates;
  response.json({ from, to, dates });
});

export const assign = asyncHandler(async (request, response) => {
  const { date, agentId, startTime, endTime } = request.body;
  const normalizedStart = normalizeTime(startTime);
  const normalizedEnd = normalizeTime(endTime);
  if (!normalizedStart || !normalizedEnd || normalizedStart >= normalizedEnd) {
    response.status(400).json({ error: 'Invalid time range' });
    return;
  }
  const agent = await findAgentById(agentId);
  if (!agent || agent.isDeleted) {
    response.status(404).json({ error: 'Agent not found' });
    return;
  }

  try {
    const slot = await createAvailability({
      date,
      agentId: agent._id,
      startTime: normalizedStart,
      endTime: normalizedEnd,
      purgeAt: purgeAtFromDate(date),
    });
    response.status(201).json({ slot: slot.toJSON() });
  } catch (error) {
    if (!hasErrorCode(error, 11000)) throw error;
    response.status(409).json({ error: 'Agent already assigned on this date' });
  }
});

export const update = asyncHandler(async (request, response) => {
  const slot = await findAvailabilityById(request.params.id);
  if (!slot) {
    response.status(404).json({ error: 'Slot not found' });
    return;
  }
  const payload = request.body;
  if (payload.agentId) {
    const agent = await findAgentById(payload.agentId);
    if (!agent || agent.isDeleted) {
      response.status(404).json({ error: 'Agent not found' });
      return;
    }
    slot.agentId = agent._id;
  }
  if (payload.date) {
    slot.date = payload.date;
    slot.purgeAt = purgeAtFromDate(payload.date);
  }
  if (payload.startTime) slot.startTime = normalizeTime(payload.startTime) || payload.startTime;
  if (payload.endTime) slot.endTime = normalizeTime(payload.endTime) || payload.endTime;
  if (!isValidTime(slot.startTime) || !isValidTime(slot.endTime) || slot.startTime >= slot.endTime) {
    response.status(400).json({ error: 'Invalid time range' });
    return;
  }

  try {
    await saveAvailability(slot);
    response.json({ slot: slot.toJSON() });
  } catch (error) {
    if (!hasErrorCode(error, 11000)) throw error;
    response.status(409).json({ error: 'Agent already assigned on this date' });
  }
});

export const remove = asyncHandler(async (request, response) => {
  const slot = await deleteAvailability(request.params.id);
  if (!slot) {
    response.status(404).json({ error: 'Slot not found' });
    return;
  }
  response.json({ ok: true });
});