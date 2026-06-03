import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TYPES,
  type NotificationChannel,
  type NotificationType,
} from '@/modules/notifications/domain/notification-preferences.types';

export class PreferenceSettingDto {
  @ApiProperty({ enum: NOTIFICATION_TYPES, example: 'marketing_email' })
  notificationType!: NotificationType;

  @ApiProperty({ enum: NOTIFICATION_CHANNELS, example: 'email' })
  channel!: NotificationChannel;

  @ApiProperty({ example: false })
  enabled!: boolean;
}

export class QuietHoursDto {
  @ApiProperty({ example: true })
  enabled!: boolean;

  @ApiProperty({ example: '22:00' })
  start!: string;

  @ApiProperty({ example: '08:00' })
  end!: string;

  @ApiProperty({ example: 'Europe/Berlin' })
  timezone!: string;
}

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ type: PreferenceSettingDto })
  preference?: PreferenceSettingDto;

  @ApiPropertyOptional({ type: [PreferenceSettingDto] })
  preferences?: PreferenceSettingDto[];

  @ApiPropertyOptional({ type: QuietHoursDto })
  quietHours?: QuietHoursDto;
}
