import { Module } from '@nestjs/common';
import { NotificationsModule } from '@/modules/notifications';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [NotificationsModule],
  controllers: [NotificationsController],
})
export class NotificationsPageModule {}
