import { Module } from '@nestjs/common';
import { AppPageModule } from './healthcheck/healthcheck.module';
import { NotificationsPageModule } from './notifications/notifications.module';

@Module({
  imports: [AppPageModule, NotificationsPageModule],
})
export class PagesModule {}
