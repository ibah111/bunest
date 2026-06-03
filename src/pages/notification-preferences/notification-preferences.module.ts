import { Module } from '@nestjs/common';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { NotificationPreferencesController } from './notification-preferences.controller';

@Module({
  imports: [NotificationsModule],
  controllers: [NotificationPreferencesController],
})
export class NotificationPreferencesPageModule {}
