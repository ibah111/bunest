import { registerAs } from '@nestjs/config';
import { readIntegerEnv, readStringEnv } from './env.helpers';

export type AppRole = 'api' | 'consumer' | 'all';

export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  role: AppRole;
}

export const appConfig = registerAs(
  'app',
  (): AppConfig => ({
    nodeEnv: readStringEnv(
      process.env.NODE_ENV,
      'development',
    ) as AppConfig['nodeEnv'],
    port: readIntegerEnv(process.env.PORT, 35700),
    role: readStringEnv(process.env.APP_ROLE, 'api') as AppRole,
  }),
);
