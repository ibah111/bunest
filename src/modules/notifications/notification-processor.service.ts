import { Injectable, Logger } from '@nestjs/common';
import { TelegramService } from '@/modules/telegram';
import type { NotificationEventMessage } from './notification-event.types';
import {
  InjectNotificationEventsRepository,
  type NotificationEventsRepository,
} from './notification-events.repository';

@Injectable()
export class NotificationProcessorService {
  private readonly logger = new Logger(NotificationProcessorService.name);

  constructor(
    @InjectNotificationEventsRepository()
    private readonly eventsRepository: NotificationEventsRepository,
    private readonly telegramService: TelegramService,
  ) {}

  async process(message: NotificationEventMessage): Promise<void> {
    const event = await this.eventsRepository.markProcessing(message);
    if (event.status === 'processed') {
      this.logger.log(`Already processed event skipped: ${message.eventId}`);
      return;
    }

    try {
      await this.telegramService.sendNotification(message);
      await this.eventsRepository.markProcessed(message.eventId);
      this.logger.log(`Event processed successfully: ${message.eventId}`);
    } catch (error) {
      const normalizedError = toError(error);
      await this.eventsRepository.markFailed(message.eventId, normalizedError);
      this.logger.error(
        `Event processing failed: ${message.eventId}`,
        normalizedError.stack,
      );
      throw normalizedError;
    }
  }
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
