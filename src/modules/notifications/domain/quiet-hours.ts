import type { QuietHours } from './notification-preferences.types';

const CLOCK_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseClockTimeToMinutes(value: string): number | null {
  const match = CLOCK_TIME_PATTERN.exec(value);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
}

export function isClockTime(value: unknown): value is string {
  return typeof value === 'string' && parseClockTimeToMinutes(value) !== null;
}

export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function isWithinQuietHours(
  datetime: Date,
  quietHours: QuietHours,
): boolean {
  if (!quietHours.enabled) {
    return false;
  }

  const start = parseClockTimeToMinutes(quietHours.start);
  const end = parseClockTimeToMinutes(quietHours.end);

  if (start === null || end === null || start === end) {
    return false;
  }

  const localMinutes = getLocalMinutes(datetime, quietHours.timezone);

  if (start < end) {
    return localMinutes >= start && localMinutes < end;
  }

  return localMinutes >= start || localMinutes < end;
}

function getLocalMinutes(datetime: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(datetime);

  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value);

  return hour * 60 + minute;
}
