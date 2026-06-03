import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import {
  NOTIFICATION_PREFERENCES_REPOSITORY,
  type NotificationPreferencesRepository,
} from './repositories/notification-preferences.repository';

@Injectable()
export class NotificationsBootstrapService
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    @Inject(NOTIFICATION_PREFERENCES_REPOSITORY)
    private readonly repository: NotificationPreferencesRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.repository.initialize?.();
  }

  async onModuleDestroy(): Promise<void> {
    await this.repository.close?.();
  }
}
