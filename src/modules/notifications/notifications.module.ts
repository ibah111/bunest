import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { readBooleanEnv } from '@/config/env.helpers';
import { RabbitmqModule } from '@/modules/rabbitmq';
import { TelegramModule } from '@/modules/telegram';
import { NotificationEventEntity } from './entities';
import { NotificationConsumerService } from './notification-consumer.service';
import {
  InMemoryNotificationEventsRepository,
  NOTIFICATION_EVENTS_REPOSITORY,
  TypeOrmNotificationEventsRepository,
} from './notification-events.repository';
import { NotificationProcessorService } from './notification-processor.service';
import { NotificationProducerService } from './notification-producer.service';

const databaseEnabled = readBooleanEnv(process.env.DATABASE_ENABLED);
const repositoryProvider = databaseEnabled
  ? TypeOrmNotificationEventsRepository
  : InMemoryNotificationEventsRepository;

@Module({
  imports: [
    RabbitmqModule,
    TelegramModule,
    ...(databaseEnabled
      ? [TypeOrmModule.forFeature([NotificationEventEntity])]
      : []),
  ],
  providers: [
    repositoryProvider,
    {
      provide: NOTIFICATION_EVENTS_REPOSITORY,
      useExisting: repositoryProvider,
    },
    NotificationProducerService,
    NotificationProcessorService,
    NotificationConsumerService,
  ],
  exports: [NotificationProducerService],
})
export class NotificationsModule {}
