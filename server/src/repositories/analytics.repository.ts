import { AnalyticsEvent } from '../models/AnalyticsEvent.js';

export interface AnalyticsEventInput {
  userId: string;
  path: string;
  type: 'page_view' | 'session_start';
}

export function createAnalyticsEvent(event: AnalyticsEventInput) {
  return AnalyticsEvent.create(event);
}

export function countEvents(type: AnalyticsEventInput['type'], since: Date) {
  return AnalyticsEvent.countDocuments({ type, createdAt: { $gte: since } });
}