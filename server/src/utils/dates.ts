import { DateTime } from 'luxon';
import { APP_TZ, AVAILABILITY_RETENTION_DAYS } from '../config.js';

export function todayYmd(): string {
  return DateTime.now().setZone(APP_TZ).toFormat('yyyy-MM-dd');
}

export function calendarDateYmd(value: unknown): string | null {
  if (!value) return todayYmd();
  const dt = DateTime.fromISO(String(value), { zone: APP_TZ });
  if (!dt.isValid) {
    const fallback = DateTime.fromFormat(String(value), 'yyyy-MM-dd', { zone: APP_TZ });
    if (!fallback.isValid) return null;
    return fallback.toFormat('yyyy-MM-dd');
  }
  return dt.toFormat('yyyy-MM-dd');
}

export function normalizeTime(hhmm: unknown): string | null {
  const match = String(hhmm || '').match(/^([01]\d|2[0-3]):([0-5]\d)/);
  return match ? `${match[1]}:${match[2]}` : null;
}

export function isValidTime(hhmm: unknown): boolean {
  return Boolean(normalizeTime(hhmm));
}

export function purgeAtFromDate(ymd: string): Date {
  const dt = DateTime.fromFormat(ymd, 'yyyy-MM-dd', { zone: APP_TZ }).plus({
    days: AVAILABILITY_RETENTION_DAYS,
  });
  return dt.toJSDate();
}

export function startOfToday(): Date {
  return DateTime.now().setZone(APP_TZ).startOf('day').toJSDate();
}

export function startOfWeek(): Date {
  return DateTime.now().setZone(APP_TZ).startOf('week').toJSDate();
}

export function startOfMonth(): Date {
  return DateTime.now().setZone(APP_TZ).startOf('month').toJSDate();
}

export function addDaysYmd(ymd: string, days: number): string {
  return DateTime.fromFormat(ymd, 'yyyy-MM-dd', { zone: APP_TZ })
    .plus({ days })
    .toFormat('yyyy-MM-dd');
}
