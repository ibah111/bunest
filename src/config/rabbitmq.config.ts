import { registerAs } from '@nestjs/config';
import { readBooleanEnv, readIntegerEnv, readStringEnv } from './env.helpers';

export interface RabbitmqConfig {
  enabled: boolean;
  url: string;
  exchange: string;
  routingKey: string;
  queue: string;
  retryQueue: string;
  retryDelayMs: number;
  deadExchange: string;
  deadRoutingKey: string;
  deadQueue: string;
  prefetch: number;
  publishRetries: number;
  connectionRetries: number;
  consumerMaxRetries: number;
}

export const rabbitmqConfig = registerAs(
  'rabbitmq',
  (): RabbitmqConfig => ({
    enabled: readBooleanEnv(process.env.RABBITMQ_ENABLED),
    url: readStringEnv(
      process.env.RABBITMQ_URL,
      'amqp://guest:guest@localhost:5672',
    ),
    exchange: readStringEnv(
      process.env.RABBITMQ_EXCHANGE,
      'notifications.events',
    ),
    routingKey: readStringEnv(
      process.env.RABBITMQ_ROUTING_KEY,
      'telegram.notification',
    ),
    queue: readStringEnv(process.env.RABBITMQ_QUEUE, 'notifications.telegram'),
    retryQueue: readStringEnv(
      process.env.RABBITMQ_RETRY_QUEUE,
      'notifications.telegram.retry',
    ),
    retryDelayMs: readIntegerEnv(process.env.RABBITMQ_RETRY_DELAY_MS, 5000),
    deadExchange: readStringEnv(
      process.env.RABBITMQ_DEAD_EXCHANGE,
      'notifications.dead',
    ),
    deadRoutingKey: readStringEnv(
      process.env.RABBITMQ_DEAD_ROUTING_KEY,
      'telegram.notification.dead',
    ),
    deadQueue: readStringEnv(
      process.env.RABBITMQ_DEAD_QUEUE,
      'notifications.telegram.dead',
    ),
    prefetch: readIntegerEnv(process.env.RABBITMQ_PREFETCH, 10),
    publishRetries: readIntegerEnv(process.env.RABBITMQ_PUBLISH_RETRIES, 3),
    connectionRetries: readIntegerEnv(
      process.env.RABBITMQ_CONNECTION_RETRIES,
      10,
    ),
    consumerMaxRetries: readIntegerEnv(
      process.env.RABBITMQ_CONSUMER_MAX_RETRIES,
      3,
    ),
  }),
);
