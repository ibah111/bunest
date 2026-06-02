import { DataSource, type DataSourceOptions } from 'typeorm';
import { readIntegerEnv, readStringEnv } from '@/config/env.helpers';
import { NotificationEventEntity } from '@/modules/notifications/entities';
import { postgresMigrations } from '@/migrations';

export function createPostgresDataSourceOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    host: readStringEnv(process.env.DB_HOST, 'localhost'),
    port: readIntegerEnv(process.env.DB_PORT, 5432),
    username: readStringEnv(process.env.DB_USERNAME, 'bunest'),
    password: readStringEnv(process.env.DB_PASSWORD, 'bunest'),
    database: readStringEnv(process.env.DB_NAME, 'bunest'),
    entities: [NotificationEventEntity],
    migrations: postgresMigrations,
    migrationsRun: false,
    synchronize: false,
    logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
  };
}

export const postgresDataSource = new DataSource(
  createPostgresDataSourceOptions(),
);
