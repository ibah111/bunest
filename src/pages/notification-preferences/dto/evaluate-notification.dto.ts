import { ApiProperty } from '@nestjs/swagger';
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TYPES,
  REGIONS,
  type NotificationChannel,
  type NotificationType,
  type Region,
} from '@/modules/notifications/domain/notification-preferences.types';

export class EvaluateNotificationDto {
  @ApiProperty({ example: 'user-1' })
  userId!: string;

  @ApiProperty({ enum: NOTIFICATION_TYPES, example: 'marketing_sms' })
  notificationType!: NotificationType;

  @ApiProperty({ enum: NOTIFICATION_CHANNELS, example: 'sms' })
  channel!: NotificationChannel;

  @ApiProperty({ enum: REGIONS, example: 'EU' })
  region!: Region;

  @ApiProperty({ example: '2026-05-21T21:30:00Z' })
  datetime!: string;
}
