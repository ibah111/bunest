import { registerAs } from '@nestjs/config';
import { readBooleanEnv, readIntegerEnv, readStringEnv } from './env.helpers';

export interface PostgresConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface DatabaseConfig {
  enabled: boolean;
  postgres: PostgresConfig;
}

export const databaseConfig = registerAs(
  'database',
  (): DatabaseConfig => ({
    enabled: readBooleanEnv(process.env.DATABASE_ENABLED),
    postgres: {
      host: readStringEnv(process.env.DB_HOST, 'localhost'),
      port: readIntegerEnv(process.env.DB_PORT, 5432),
      username: readStringEnv(process.env.DB_USERNAME, 'bunest'),
      password: readStringEnv(process.env.DB_PASSWORD, 'bunest'),
      database: readStringEnv(process.env.DB_NAME, 'bunest'),
    },
  }),
);
