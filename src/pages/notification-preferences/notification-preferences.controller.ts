import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { NotificationPreferencesService } from '@/modules/notifications/domain/notification-preferences.service';
import type {
  EvaluateNotificationCommand,
  EvaluationResult,
  UpdatePreferencesCommand,
  UserPreferencesView,
} from '@/modules/notifications/domain/notification-preferences.types';
import { EvaluateNotificationDto } from './dto/evaluate-notification.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { ParseEvaluateNotificationPipe } from './pipes/parse-evaluate-notification.pipe';
import { ParseUpdatePreferencesPipe } from './pipes/parse-update-preferences.pipe';
import { ParseUserIdPipe } from './pipes/parse-user-id.pipe';

@ApiTags('notification-preferences')
@Controller()
export class NotificationPreferencesController {
  constructor(
    private readonly preferencesService: NotificationPreferencesService,
  ) {}

  @Get('users/:id/preferences')
  @ApiOkResponse({ description: 'Current resolved notification preferences.' })
  getUserPreferences(
    @Param('id', ParseUserIdPipe) userId: string,
  ): Promise<UserPreferencesView> {
    return this.preferencesService.getPreferences(userId);
  }

  @Post('users/:id/preferences')
  @ApiBody({ type: UpdatePreferencesDto })
  @ApiOkResponse({ description: 'Updated resolved notification preferences.' })
  updateUserPreferences(
    @Param('id', ParseUserIdPipe) userId: string,
    @Body(ParseUpdatePreferencesPipe) command: UpdatePreferencesCommand,
  ): Promise<UserPreferencesView> {
    return this.preferencesService.updatePreferences(userId, command);
  }

  @Post('evaluate')
  @ApiBody({ type: EvaluateNotificationDto })
  @ApiOkResponse({ description: 'Notification delivery decision.' })
  evaluateNotification(
    @Body(ParseEvaluateNotificationPipe) command: EvaluateNotificationCommand,
  ): Promise<EvaluationResult> {
    return this.preferencesService.evaluate(command);
  }
}
