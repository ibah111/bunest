import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RabbitmqService } from '@/modules/rabbitmq';
import type { CreateNotificationEventDto } from './dto/create-notification-event.dto';
import type { NotificationEventResponseDto } from './dto/notification-event-response.dto';
import type { NotificationEventMessage } from './notification-event.types';
import {
  InjectNotificationEventsRepository,
  type NotificationEventsRepository,
} from './notification-events.repository';

@Injectable()
export class NotificationProducerService {
  private readonly logger = new Logger(NotificationProducerService.name);

  constructor(
    @InjectNotificationEventsRepository()
    private readonly eventsRepository: NotificationEventsRepository,
    private readonly rabbitmqService: RabbitmqService,
  ) {}

  async enqueue(
    dto: CreateNotificationEventDto,
  ): Promise<NotificationEventResponseDto> {
    const message = this.toMessage(dto);
    const stored = await this.eventsRepository.createQueued(message);

    if (!stored.created) {
      this.logger.log(`Duplicate event skipped: ${message.eventId}`);
      return {
        eventId: message.eventId,
        status: stored.event.status,
        queued: false,
        duplicate: true,
      };
    }

    try {
      await this.rabbitmqService.publishJson(message, message.eventId);
      this.logger.log(`Event published to RabbitMQ: ${message.eventId}`);
      return {
        eventId: message.eventId,
        status: 'queued',
        queued: true,
        duplicate: false,
      };
    } catch (error) {
      await this.eventsRepository.markFailed(message.eventId, toError(error));
      throw new ServiceUnavailableException('RabbitMQ publish failed');
    }
  }

  private toMessage(dto: CreateNotificationEventDto): NotificationEventMessage {
    return {
      eventId: dto.eventId ?? randomUUID(),
      type: dto.type,
      telegramChatId: dto.telegramChatId,
      message: dto.message,
      payload: dto.payload ?? {},
      occurredAt: dto.occurredAt ?? new Date().toISOString(),
    };
  }
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
