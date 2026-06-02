import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Channel, ConsumeMessage } from 'amqplib';
import { appConfig, rabbitmqConfig } from '@/config';
import { RabbitmqService } from '@/modules/rabbitmq';
import { parseNotificationEventMessage } from './notification-message.parser';
import { NotificationProcessorService } from './notification-processor.service';

@Injectable()
export class NotificationConsumerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(NotificationConsumerService.name);

  constructor(
    @Inject(appConfig.KEY)
    private readonly app: ConfigType<typeof appConfig>,
    @Inject(rabbitmqConfig.KEY)
    private readonly rabbitmq: ConfigType<typeof rabbitmqConfig>,
    private readonly rabbitmqService: RabbitmqService,
    private readonly processor: NotificationProcessorService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.app.role !== 'consumer' && this.app.role !== 'all') {
      return;
    }

    if (!this.rabbitmq.enabled) {
      this.logger.warn('Consumer role selected, but RabbitMQ is disabled');
      return;
    }

    await this.rabbitmqService.consume((message, channel) =>
      this.handleMessage(message, channel),
    );
  }

  private async handleMessage(
    rawMessage: ConsumeMessage,
    channel: Channel,
  ): Promise<void> {
    let retryCount = this.rabbitmqService.getRetryCount(rawMessage);

    try {
      const payload = JSON.parse(
        rawMessage.content.toString('utf8'),
      ) as unknown;
      const message = parseNotificationEventMessage(payload);

      await this.processor.process(message);
      channel.ack(rawMessage);
      return;
    } catch (error) {
      const normalizedError = toError(error);
      retryCount += 1;

      if (retryCount <= this.rabbitmq.consumerMaxRetries) {
        this.rabbitmqService.sendToRetryQueue(channel, rawMessage, retryCount);
        channel.ack(rawMessage);
        this.logger.warn(
          `Message processing failed. Scheduled retry ${retryCount}/${this.rabbitmq.consumerMaxRetries}: ${normalizedError.message}`,
        );
        return;
      }

      this.rabbitmqService.sendToDeadQueue(channel, rawMessage);
      channel.ack(rawMessage);
      this.logger.error(
        `Message moved to dead queue after ${this.rabbitmq.consumerMaxRetries} retries: ${normalizedError.message}`,
        normalizedError.stack,
      );
    }
  }
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
