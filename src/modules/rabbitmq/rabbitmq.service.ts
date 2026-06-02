import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationShutdown,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import * as amqp from 'amqplib';
import type {
  Channel,
  ChannelModel,
  ConfirmChannel,
  ConsumeMessage,
  Options,
} from 'amqplib';
import { rabbitmqConfig } from '@/config';
import { RABBITMQ_RETRY_COUNT_HEADER } from './rabbitmq.constants';

type MessageHandler = (
  message: ConsumeMessage,
  channel: Channel,
) => Promise<void>;

@Injectable()
export class RabbitmqService implements OnApplicationShutdown {
  private readonly logger = new Logger(RabbitmqService.name);
  private connection: ChannelModel | null = null;
  private confirmChannel: ConfirmChannel | null = null;
  private consumerChannel: Channel | null = null;
  private confirmTopologyReady = false;
  private consumerTopologyReady = false;

  constructor(
    @Inject(rabbitmqConfig.KEY)
    private readonly config: ConfigType<typeof rabbitmqConfig>,
  ) {}

  async publishJson<T extends object>(
    payload: T,
    messageId: string,
  ): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('RabbitMQ is disabled');
    }

    const body = Buffer.from(JSON.stringify(payload));
    await this.withRetry(async () => {
      const channel = await this.getConfirmChannel();
      await this.publishWithConfirm(channel, body, {
        contentType: 'application/json',
        messageId,
        correlationId: messageId,
        persistent: true,
        timestamp: Date.now(),
      });
    });
  }

  async consume(handler: MessageHandler): Promise<void> {
    if (!this.config.enabled) {
      this.logger.warn(
        'RabbitMQ consumer skipped because RabbitMQ is disabled',
      );
      return;
    }

    const channel = await this.getConsumerChannel();
    await channel.prefetch(this.config.prefetch);
    await channel.consume(
      this.config.queue,
      async (message) => {
        if (!message) {
          return;
        }

        await handler(message, channel);
      },
      { noAck: false },
    );

    this.logger.log(
      `RabbitMQ consumer subscribed to queue "${this.config.queue}"`,
    );
  }

  getRetryCount(message: ConsumeMessage): number {
    const value = message.properties.headers?.[RABBITMQ_RETRY_COUNT_HEADER];
    return typeof value === 'number'
      ? value
      : Number.parseInt(String(value ?? 0), 10);
  }

  sendToRetryQueue(
    channel: Channel,
    message: ConsumeMessage,
    nextRetryCount: number,
  ): void {
    channel.sendToQueue(this.config.retryQueue, message.content, {
      ...this.copyPublishOptions(message),
      headers: {
        ...(message.properties.headers ?? {}),
        [RABBITMQ_RETRY_COUNT_HEADER]: nextRetryCount,
      },
      timestamp: Date.now(),
    });
  }

  sendToDeadQueue(channel: Channel, message: ConsumeMessage): void {
    channel.publish(
      this.config.deadExchange,
      this.config.deadRoutingKey,
      message.content,
      {
        ...this.copyPublishOptions(message),
        timestamp: Date.now(),
      },
    );
  }

  async onApplicationShutdown(): Promise<void> {
    await this.closeChannel(this.consumerChannel);
    await this.closeChannel(this.confirmChannel);
    this.consumerChannel = null;
    this.confirmChannel = null;

    if (this.connection) {
      await this.connection.close().catch((error: Error) => {
        this.logger.warn(`RabbitMQ connection close failed: ${error.message}`);
      });
      this.connection = null;
    }
  }

  private async withRetry(work: () => Promise<void>): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.publishRetries; attempt += 1) {
      try {
        await work();
        return;
      } catch (error) {
        lastError = toError(error);
        this.logger.warn(
          `RabbitMQ publish attempt ${attempt}/${this.config.publishRetries} failed: ${lastError.message}`,
        );
        await this.resetConfirmChannel();
        await delay(backoff(attempt));
      }
    }

    throw lastError ?? new Error('RabbitMQ publish failed');
  }

  private async getConfirmChannel(): Promise<ConfirmChannel> {
    if (!this.confirmChannel) {
      const connection = await this.getConnection();
      this.confirmChannel = await connection.createConfirmChannel();
      this.confirmTopologyReady = false;
      this.confirmChannel.on('close', () => {
        this.confirmChannel = null;
        this.confirmTopologyReady = false;
      });
      this.confirmChannel.on('error', (error) => {
        this.logger.warn(`RabbitMQ confirm channel error: ${error.message}`);
      });
    }

    if (!this.confirmTopologyReady) {
      await this.assertTopology(this.confirmChannel);
      this.confirmTopologyReady = true;
    }

    return this.confirmChannel;
  }

  private async getConsumerChannel(): Promise<Channel> {
    if (!this.consumerChannel) {
      const connection = await this.getConnection();
      this.consumerChannel = await connection.createChannel();
      this.consumerTopologyReady = false;
      this.consumerChannel.on('close', () => {
        this.consumerChannel = null;
        this.consumerTopologyReady = false;
      });
      this.consumerChannel.on('error', (error) => {
        this.logger.warn(`RabbitMQ consumer channel error: ${error.message}`);
      });
    }

    if (!this.consumerTopologyReady) {
      await this.assertTopology(this.consumerChannel);
      this.consumerTopologyReady = true;
    }

    return this.consumerChannel;
  }

  private async getConnection(): Promise<ChannelModel> {
    if (this.connection) {
      return this.connection;
    }

    let lastError: Error | null = null;

    for (
      let attempt = 1;
      attempt <= this.config.connectionRetries;
      attempt += 1
    ) {
      try {
        this.connection = await amqp.connect(this.config.url);
        this.connection.on('close', (error) => {
          this.logger.warn(
            `RabbitMQ connection closed${error ? `: ${error.message}` : ''}`,
          );
          this.connection = null;
          this.confirmChannel = null;
          this.consumerChannel = null;
          this.confirmTopologyReady = false;
          this.consumerTopologyReady = false;
        });
        this.connection.on('error', (error) => {
          this.logger.warn(`RabbitMQ connection error: ${error.message}`);
        });
        this.logger.log('RabbitMQ connection established');
        return this.connection;
      } catch (error) {
        lastError = toError(error);
        this.logger.warn(
          `RabbitMQ connection attempt ${attempt}/${this.config.connectionRetries} failed: ${lastError.message}`,
        );
        await delay(backoff(attempt));
      }
    }

    throw lastError ?? new Error('RabbitMQ connection failed');
  }

  private async assertTopology(channel: Channel): Promise<void> {
    await channel.assertExchange(this.config.exchange, 'direct', {
      durable: true,
    });
    await channel.assertExchange(this.config.deadExchange, 'direct', {
      durable: true,
    });
    await channel.assertQueue(this.config.queue, {
      durable: true,
    });
    await channel.assertQueue(this.config.retryQueue, {
      durable: true,
      messageTtl: this.config.retryDelayMs,
      deadLetterExchange: this.config.exchange,
      deadLetterRoutingKey: this.config.routingKey,
    });
    await channel.assertQueue(this.config.deadQueue, {
      durable: true,
    });
    await channel.bindQueue(
      this.config.queue,
      this.config.exchange,
      this.config.routingKey,
    );
    await channel.bindQueue(
      this.config.deadQueue,
      this.config.deadExchange,
      this.config.deadRoutingKey,
    );
  }

  private async publishWithConfirm(
    channel: ConfirmChannel,
    body: Buffer,
    options: Options.Publish,
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      channel.publish(
        this.config.exchange,
        this.config.routingKey,
        body,
        options,
        (error) => {
          if (error) {
            reject(toError(error));
            return;
          }

          resolve();
        },
      );
    });
  }

  private copyPublishOptions(message: ConsumeMessage): Options.Publish {
    return {
      contentType: message.properties.contentType ?? 'application/json',
      contentEncoding: message.properties.contentEncoding,
      correlationId: message.properties.correlationId,
      messageId: message.properties.messageId,
      persistent: true,
      headers: message.properties.headers,
    };
  }

  private async resetConfirmChannel(): Promise<void> {
    await this.closeChannel(this.confirmChannel);
    this.confirmChannel = null;
    this.confirmTopologyReady = false;
  }

  private async closeChannel(
    channel: Channel | ConfirmChannel | null,
  ): Promise<void> {
    if (!channel) {
      return;
    }

    await channel.close().catch((error: Error) => {
      this.logger.warn(`RabbitMQ channel close failed: ${error.message}`);
    });
  }
}

function backoff(attempt: number): number {
  return Math.min(500 * 2 ** (attempt - 1), 10000);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
