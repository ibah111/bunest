import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiAcceptedResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateNotificationEventDto,
  NotificationEventResponseDto,
  NotificationProducerService,
} from '@/modules/notifications';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly producer: NotificationProducerService) {}

  @Post('events')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiAcceptedResponse({
    description: 'Notification event accepted for RabbitMQ delivery.',
    type: NotificationEventResponseDto,
  })
  enqueue(
    @Body() dto: CreateNotificationEventDto,
  ): Promise<NotificationEventResponseDto> {
    return this.producer.enqueue(dto);
  }
}
