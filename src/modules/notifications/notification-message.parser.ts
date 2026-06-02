import type { NotificationEventMessage } from './notification-event.types';

export function parseNotificationEventMessage(
  value: unknown,
): NotificationEventMessage {
  if (!isRecord(value)) {
    throw new Error('RabbitMQ message must be a JSON object');
  }

  const { eventId, type, occurredAt, telegramChatId, message, payload } = value;
  if (
    typeof eventId !== 'string' ||
    typeof type !== 'string' ||
    typeof occurredAt !== 'string' ||
    typeof telegramChatId !== 'string' ||
    typeof message !== 'string' ||
    !isRecord(payload)
  ) {
    throw new Error('RabbitMQ message has invalid notification event shape');
  }

  return {
    eventId,
    type,
    occurredAt,
    telegramChatId,
    message,
    payload,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
