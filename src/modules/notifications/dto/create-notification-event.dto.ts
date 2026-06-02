import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateNotificationEventDto {
  // @ApiPropertyOptional({
  //   description:
  //     'Optional idempotency key. If omitted, the API generates UUID.',
  //   example: 'c0f8f9aa-2e26-4df3-a31d-14ea4bd72917',
  // })
  // @IsOptional()
  // @IsUUID('4')
  // eventId?: string;

  @ApiProperty({
    description: 'Business event type.',
    example: 'order.created',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 80)
  type!: string;

  @ApiProperty({
    description: 'Telegram chat id accepted by Bot API.',
    example: '-1001234567890',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  telegramChatId!: string;

  @ApiProperty({
    description: 'Notification text.',
    example: 'Order #42 was created.',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 4096)
  message!: string;

  @ApiPropertyOptional({
    description: 'Arbitrary JSON payload stored with the event.',
    example: { orderId: 42, amount: 1990 },
  })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'ISO 8601 event timestamp. Defaults to current time.',
    example: '2026-06-02T08:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}
