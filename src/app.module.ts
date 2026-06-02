import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  appConfig,
  databaseConfig,
  rabbitmqConfig,
  telegramConfig,
  validateEnv,
} from './config';
import { PagesModule } from './pages';
import { ModuleOfModules } from './modules';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, databaseConfig, rabbitmqConfig, telegramConfig],
      validate: validateEnv,
    }),
    PagesModule,
    ModuleOfModules,
  ],
})
export class AppModule {}
