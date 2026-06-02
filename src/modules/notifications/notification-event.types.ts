export type NotificationEventStatus =
  | 'queued'
  | 'processing'
  | 'processed'
  | 'failed';

export interface NotificationEventMessage {
  eventId: string;
  type: string;
  occurredAt: string;
  telegramChatId: string;
  message: string;
  payload: Record<string, unknown>;
}

export interface NotificationEventRecord extends NotificationEventMessage {
  status: NotificationEventStatus;
  attempts: number;
  lastError: string | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredNotificationEvent {
  event: NotificationEventRecord;
  created: boolean;
}
