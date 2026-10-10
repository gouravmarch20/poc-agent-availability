import { api } from '../api';
import { AvailabilityResponseSchema, OkResponseSchema, SlotResponseSchema, UpcomingDatesSchema } from '../apiSchemas';

export interface AvailabilityPayload {
  date: string;
  agentId: string;
  startTime: string;
  endTime: string;
}

export function listAvailability(date?: string, signal?: AbortSignal) {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return api(`/api/availability${query}`, { signal, responseSchema: AvailabilityResponseSchema });
}

export function listUpcomingDates(signal?: AbortSignal) {
  return api('/api/availability/upcoming', { signal, responseSchema: UpcomingDatesSchema });
}

export function assignAvailability(payload: AvailabilityPayload) {
  return api('/api/availability', { method: 'POST', json: payload, responseSchema: SlotResponseSchema });
}

export function updateAvailability(id: string, payload: Partial<AvailabilityPayload>) {
  return api(`/api/availability/${id}`, { method: 'PATCH', json: payload, responseSchema: SlotResponseSchema });
}

export function deleteAvailability(id: string) {
  return api(`/api/availability/${id}`, { method: 'DELETE', responseSchema: OkResponseSchema });
}