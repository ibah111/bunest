import { registerAs } from '@nestjs/config';
import { readBooleanEnv, readIntegerEnv, readStringEnv } from './env.helpers';

export interface TelegramConfig {
  enabled: boolean;
  botToken: string;
  requestTimeoutSeconds: number;
}

export const telegramConfig = registerAs(
  'telegram',
  (): TelegramConfig => ({
    enabled: readBooleanEnv(process.env.TELEGRAM_ENABLED),
    botToken: readStringEnv(process.env.TELEGRAM_BOT_TOKEN, ''),
    requestTimeoutSeconds: readIntegerEnv(
      process.env.TELEGRAM_REQUEST_TIMEOUT_SECONDS,
      30,
    ),
  }),
);
