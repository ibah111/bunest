import { Module } from '@nestjs/common';
import { AppPageModule } from './healthcheck/healthcheck.module';
import { NotificationPreferencesPageModule } from './notification-preferences/notification-preferences.module';

@Module({
  imports: [AppPageModule, NotificationPreferencesPageModule],
})
export class PagesModule {}
