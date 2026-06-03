import { Module, type Provider } from '@nestjs/common';
import { NotificationPreferencesService } from './domain/notification-preferences.service';
import { InMemoryNotificationPreferencesRepository } from './infrastructure/in-memory-notification-preferences.repository';
import { PostgresNotificationPreferencesRepository } from './infrastructure/postgres-notification-preferences.repository';
import { NotificationsBootstrapService } from './notifications-bootstrap.service';
import {
  NOTIFICATION_PREFERENCES_REPOSITORY,
  type NotificationPreferencesRepository,
} from './repositories/notification-preferences.repository';

const repositoryProvider: Provider<NotificationPreferencesRepository> = {
  provide: NOTIFICATION_PREFERENCES_REPOSITORY,
  useFactory: () => {
    if (
      process.env.NOTIFICATIONS_STORAGE === 'memory' ||
      process.env.NODE_ENV === 'test'
    ) {
      return new InMemoryNotificationPreferencesRepository();
    }

    return new PostgresNotificationPreferencesRepository();
  },
};

@Module({
  providers: [
    NotificationPreferencesService,
    NotificationsBootstrapService,
    repositoryProvider,
  ],
  exports: [NotificationPreferencesService],
})
export class NotificationsModule {}
