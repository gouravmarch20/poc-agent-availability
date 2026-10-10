import { ANALYTICS_CACHE_MS } from '../config.js';
import { countEvents, createAnalyticsEvent } from '../repositories/analytics.repository.js';
import { startOfMonth, startOfToday, startOfWeek } from '../utils/dates.js';
import { asyncHandler } from '../utils/asyncHandler.js';

interface AnalyticsPayload {
  cached: boolean;
  refreshedAt: string;
  today: { pageViews: number; sessions: number };
  week: { pageViews: number; sessions: number };
  month: { pageViews: number; sessions: number };
}

let cache: { at: number; payload: AnalyticsPayload | null } = { at: 0, payload: null };

export const trackEvent = asyncHandler(async (request, response) => {
  await createAnalyticsEvent({
    userId: String(request.user._id),
    path: request.body.path,
    type: request.body.type,
  });
  cache = { at: 0, payload: null };
  response.status(201).json({ ok: true });
});

export const getStats = asyncHandler(async (_request, response) => {
  const now = Date.now();
  if (cache.payload && now - cache.at < ANALYTICS_CACHE_MS) {
    response.json({ ...cache.payload, cached: true });
    return;
  }

  const [todayViews, weekViews, monthViews, todaySessions, weekSessions, monthSessions] = await Promise.all([
    countEvents('page_view', startOfToday()),
    countEvents('page_view', startOfWeek()),
    countEvents('page_view', startOfMonth()),
    countEvents('session_start', startOfToday()),
    countEvents('session_start', startOfWeek()),
    countEvents('session_start', startOfMonth()),
  ]);

  const payload: AnalyticsPayload = {
    cached: false,
    refreshedAt: new Date().toISOString(),
    today: { pageViews: todayViews, sessions: todaySessions },
    week: { pageViews: weekViews, sessions: weekSessions },
    month: { pageViews: monthViews, sessions: monthSessions },
  };
  cache = { at: now, payload };
  response.json(payload);
});