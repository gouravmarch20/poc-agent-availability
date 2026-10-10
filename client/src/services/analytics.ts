import { api } from '../api';
import { AnalyticsSummarySchema, OkResponseSchema } from '../apiSchemas';

export function getAnalytics(signal?: AbortSignal) {
  return api('/api/analytics/stats', { signal, responseSchema: AnalyticsSummarySchema });
}

export function trackPage(path: string) {
  return api('/api/analytics/events', {
    method: 'POST',
    json: { path, type: 'page_view' },
    responseSchema: OkResponseSchema,
  });
}