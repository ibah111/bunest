import type { AppRole } from './app.config';
import { readBooleanEnv, readIntegerEnv, readStringEnv } from './env.helpers';

const APP_ROLES: AppRole[] = ['api', 'consumer', 'all'];

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const normalized = normalize(config);
  const missing: string[] = [];

  if (normalized.DATABASE_ENABLED) {
    requireValues(normalized, missing, [
      'DB_HOST',
      'DB_PORT',
      'DB_USERNAME',
      'DB_PASSWORD',
      'DB_NAME',
    ]);
  }

  if (normalized.RABBITMQ_ENABLED) {
    requireValues(normalized, missing, ['RABBITMQ_URL']);
  }

  if (normalized.TELEGRAM_ENABLED) {
    requireValues(normalized, missing, ['TELEGRAM_BOT_TOKEN']);
  }

  if (!APP_ROLES.includes(normalized.APP_ROLE)) {
    throw new Error(
      `APP_ROLE must be one of: ${APP_ROLES.join(', ')}. Received: ${String(
        normalized.APP_ROLE,
      )}`,
    );
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  return {
    ...config,
    NODE_ENV: normalized.NODE_ENV,
    PORT: String(normalized.PORT),
    APP_ROLE: normalized.APP_ROLE,
    DATABASE_ENABLED: String(normalized.DATABASE_ENABLED),
    RABBITMQ_ENABLED: String(normalized.RABBITMQ_ENABLED),
    TELEGRAM_ENABLED: String(normalized.TELEGRAM_ENABLED),
  };
}

function normalize(config: Record<string, unknown>) {
  const env = (key: string): string | undefined => {
    const value = config[key];
    return typeof value === 'string' ? value : undefined;
  };

  return {
    NODE_ENV: readStringEnv(env('NODE_ENV'), 'development') as string,
    PORT: readIntegerEnv(env('PORT'), 35700),
    APP_ROLE: readStringEnv(env('APP_ROLE'), 'api') as AppRole,
    DATABASE_ENABLED: readBooleanEnv(env('DATABASE_ENABLED')),
    RABBITMQ_ENABLED: readBooleanEnv(env('RABBITMQ_ENABLED')),
    TELEGRAM_ENABLED: readBooleanEnv(env('TELEGRAM_ENABLED')),
    DB_HOST: env('DB_HOST'),
    DB_PORT: env('DB_PORT'),
    DB_USERNAME: env('DB_USERNAME'),
    DB_PASSWORD: env('DB_PASSWORD'),
    DB_NAME: env('DB_NAME'),
    RABBITMQ_URL: env('RABBITMQ_URL'),
    TELEGRAM_BOT_TOKEN: env('TELEGRAM_BOT_TOKEN'),
  };
}

function requireValues(
  config: Record<string, unknown>,
  missing: string[],
  keys: string[],
): void {
  for (const key of keys) {
    const value = config[key];
    if (value === undefined || value === '') {
      missing.push(key);
    }
  }
}
