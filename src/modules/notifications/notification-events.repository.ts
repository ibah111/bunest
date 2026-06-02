import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { NotificationEventEntity } from './entities';
import type {
  NotificationEventMessage,
  NotificationEventRecord,
  StoredNotificationEvent,
} from './notification-event.types';

export const NOTIFICATION_EVENTS_REPOSITORY = Symbol(
  'NOTIFICATION_EVENTS_REPOSITORY',
);

export interface NotificationEventsRepository {
  createQueued(
    message: NotificationEventMessage,
  ): Promise<StoredNotificationEvent>;
  markProcessing(
    message: NotificationEventMessage,
  ): Promise<NotificationEventRecord>;
  markProcessed(eventId: string): Promise<void>;
  markFailed(eventId: string, error: Error): Promise<void>;
  findByEventId(eventId: string): Promise<NotificationEventRecord | null>;
}

export function InjectNotificationEventsRepository() {
  return Inject(NOTIFICATION_EVENTS_REPOSITORY);
}

@Injectable()
export class TypeOrmNotificationEventsRepository
  implements NotificationEventsRepository
{
  constructor(
    @InjectRepository(NotificationEventEntity)
    private readonly repository: Repository<NotificationEventEntity>,
  ) {}

  async createQueued(
    message: NotificationEventMessage,
  ): Promise<StoredNotificationEvent> {
    const existing = await this.findByEventId(message.eventId);
    if (existing) {
      return { event: existing, created: false };
    }

    const now = new Date();
    const entity = this.repository.create({
      ...message,
      status: 'queued',
      attempts: 0,
      lastError: null,
      processedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    try {
      const saved = await this.repository.save(entity);
      return { event: saved, created: true };
    } catch (error) {
      const duplicate = await this.findByEventId(message.eventId);
      if (duplicate) {
        return { event: duplicate, created: false };
      }

      throw error;
    }
  }

  async markProcessing(
    message: NotificationEventMessage,
  ): Promise<NotificationEventRecord> {
    const existing = await this.repository.findOne({
      where: { eventId: message.eventId },
    });

    if (existing?.status === 'processed') {
      return existing;
    }

    const entity =
      existing ??
      this.repository.create({
        ...message,
        attempts: 0,
        lastError: null,
        processedAt: null,
      });

    entity.type = message.type;
    entity.telegramChatId = message.telegramChatId;
    entity.message = message.message;
    entity.payload = message.payload;
    entity.occurredAt = message.occurredAt;
    entity.status = 'processing';
    entity.attempts += 1;
    entity.lastError = null;

    return this.repository.save(entity);
  }

  async markProcessed(eventId: string): Promise<void> {
    await this.repository.update(eventId, {
      status: 'processed',
      processedAt: new Date(),
      lastError: null,
    });
  }

  async markFailed(eventId: string, error: Error): Promise<void> {
    await this.repository.update(eventId, {
      status: 'failed',
      lastError: error.message,
    });
  }

  async findByEventId(
    eventId: string,
  ): Promise<NotificationEventRecord | null> {
    return this.repository.findOne({ where: { eventId } });
  }
}

@Injectable()
export class InMemoryNotificationEventsRepository
  implements NotificationEventsRepository
{
  private readonly events = new Map<string, NotificationEventRecord>();

  async createQueued(
    message: NotificationEventMessage,
  ): Promise<StoredNotificationEvent> {
    const existing = this.events.get(message.eventId);
    if (existing) {
      return { event: existing, created: false };
    }

    const now = new Date();
    const event: NotificationEventRecord = {
      ...message,
      status: 'queued',
      attempts: 0,
      lastError: null,
      processedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.events.set(message.eventId, event);

    return { event, created: true };
  }

  async markProcessing(
    message: NotificationEventMessage,
  ): Promise<NotificationEventRecord> {
    const existing = this.events.get(message.eventId);
    if (existing?.status === 'processed') {
      return existing;
    }

    const now = new Date();
    const event: NotificationEventRecord = {
      ...(existing ?? {
        eventId: randomUUID(),
        createdAt: now,
        attempts: 0,
        lastError: null,
        processedAt: null,
      }),
      ...message,
      status: 'processing',
      attempts: (existing?.attempts ?? 0) + 1,
      lastError: null,
      updatedAt: now,
    };
    this.events.set(message.eventId, event);

    return event;
  }

  async markProcessed(eventId: string): Promise<void> {
    const event = this.events.get(eventId);
    if (!event) {
      return;
    }

    event.status = 'processed';
    event.lastError = null;
    event.processedAt = new Date();
    event.updatedAt = new Date();
  }

  async markFailed(eventId: string, error: Error): Promise<void> {
    const event = this.events.get(eventId);
    if (!event) {
      return;
    }

    event.status = 'failed';
    event.lastError = error.message;
    event.updatedAt = new Date();
  }

  async findByEventId(
    eventId: string,
  ): Promise<NotificationEventRecord | null> {
    return this.events.get(eventId) ?? null;
  }
}
