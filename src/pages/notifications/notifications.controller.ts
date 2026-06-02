import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
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

  @Get('events')
  @HttpCode(HttpStatus.OK)
  @ApiAcceptedResponse({
    description: 'List of all notification events in the system.',
    type: [NotificationEventResponseDto],
  })
  async getAllQueued(): Promise<any> {
    return this.producer.getAllQueued();
  }

  @Post('events')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiAcceptedResponse({
    description: 'Notification event accepted for RabbitMQ delivery.',
    type: NotificationEventResponseDto,
  })
  async enqueue(
    @Body() dto: CreateNotificationEventDto,
  ): Promise<NotificationEventResponseDto> {
    return this.producer.enqueue(dto);
  }
}
