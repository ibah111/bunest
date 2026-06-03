import { BadRequestException } from '@nestjs/common';
import {
  isCompatibleNotificationPair,
  isNotificationChannel,
  isNotificationType,
  isRegion,
  type EvaluateNotificationCommand,
  type PreferenceSetting,
  type QuietHours,
  type Region,
} from '@/modules/notifications/domain/notification-preferences.types';
import {
  isClockTime,
  isValidTimeZone,
  parseClockTimeToMinutes,
} from '@/modules/notifications/domain/quiet-hours';

type JsonRecord = Record<string, unknown>;

export function parseUserId(value: unknown, path = 'userId'): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BadRequestException(`${path} must be a non-empty string`);
  }

  return value.trim();
}

export function parsePreferenceSetting(
  value: unknown,
  path: string,
): PreferenceSetting {
  const record = parseRecord(value, path);
  const notificationType = record.notificationType;
  const channel = record.channel;
  const enabled = record.enabled;

  if (!isNotificationType(notificationType)) {
    throw new BadRequestException(`${path}.notificationType is not supported`);
  }

  if (!isNotificationChannel(channel)) {
    throw new BadRequestException(`${path}.channel is not supported`);
  }

  if (!isCompatibleNotificationPair(notificationType, channel)) {
    throw new BadRequestException(
      `${path}.notificationType does not match ${path}.channel`,
    );
  }

  if (typeof enabled !== 'boolean') {
    throw new BadRequestException(`${path}.enabled must be a boolean`);
  }

  return { notificationType, channel, enabled };
}

export function parseQuietHours(value: unknown, path: string): QuietHours {
  const record = parseRecord(value, path);
  const enabled = record.enabled;
  const start = record.start;
  const end = record.end;
  const timezone = record.timezone;

  if (typeof enabled !== 'boolean') {
    throw new BadRequestException(`${path}.enabled must be a boolean`);
  }

  if (!isClockTime(start)) {
    throw new BadRequestException(`${path}.start must use HH:mm format`);
  }

  if (!isClockTime(end)) {
    throw new BadRequestException(`${path}.end must use HH:mm format`);
  }

  if (parseClockTimeToMinutes(start) === parseClockTimeToMinutes(end)) {
    throw new BadRequestException(`${path}.start and ${path}.end must differ`);
  }

  if (!isValidTimeZone(timezone)) {
    throw new BadRequestException(`${path}.timezone must be an IANA timezone`);
  }

  return { enabled, start, end, timezone };
}

export function parseEvaluationCommand(
  value: unknown,
): EvaluateNotificationCommand {
  const record = parseRecord(value, 'body');
  const userId = parseUserId(record.userId);
  const notificationType = record.notificationType;
  const channel = record.channel;
  const region = parseRegion(record.region);
  const datetime = parseDatetime(record.datetime);

  if (!isNotificationType(notificationType)) {
    throw new BadRequestException('notificationType is not supported');
  }

  if (!isNotificationChannel(channel)) {
    throw new BadRequestException('channel is not supported');
  }

  if (!isCompatibleNotificationPair(notificationType, channel)) {
    throw new BadRequestException('notificationType does not match channel');
  }

  return { userId, notificationType, channel, region, datetime };
}

export function parseRecord(value: unknown, path: string): JsonRecord {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new BadRequestException(`${path} must be an object`);
  }

  return value as JsonRecord;
}

function parseRegion(value: unknown): Region {
  if (!isRegion(value)) {
    throw new BadRequestException('region is not supported');
  }

  return value;
}

function parseDatetime(value: unknown): Date {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BadRequestException('datetime must be an ISO date-time string');
  }

  const datetime = new Date(value);

  if (Number.isNaN(datetime.getTime())) {
    throw new BadRequestException('datetime must be an ISO date-time string');
  }

  return datetime;
}
