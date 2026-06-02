import { Module } from '@nestjs/common';
import { DatabasesModule } from './databases';
import { NotificationsModule } from './notifications';
import { RabbitmqModule } from './rabbitmq';
import { TelegramModule } from './telegram';

@Module({
  imports: [
    DatabasesModule,
    RabbitmqModule,
    TelegramModule,
    NotificationsModule,
  ],
})
export class ModuleOfModules {}
