import { ApiProperty } from '@nestjs/swagger';
import type { NotificationEventStatus } from '../notification-event.types';

export class NotificationEventResponseDto {
  @ApiProperty({
    example: 'c0f8f9aa-2e26-4df3-a31d-14ea4bd72917',
  })
  eventId!: string;

  @ApiProperty({
    enum: ['queued', 'processing', 'processed', 'failed'],
    example: 'queued',
  })
  status!: NotificationEventStatus;

  @ApiProperty({
    description:
      'True when the event was published to RabbitMQ by this request.',
    example: true,
  })
  queued!: boolean;

  @ApiProperty({
    description: 'True when the idempotency key already existed.',
    example: false,
  })
  duplicate!: boolean;
}
