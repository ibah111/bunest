import { Injectable, type PipeTransform } from '@nestjs/common';
import type { EvaluateNotificationCommand } from '@/modules/notifications/domain/notification-preferences.types';
import { parseEvaluationCommand } from './notification-input.parsers';

@Injectable()
export class ParseEvaluateNotificationPipe
  implements PipeTransform<unknown, EvaluateNotificationCommand>
{
  transform(value: unknown): EvaluateNotificationCommand {
    return parseEvaluationCommand(value);
  }
}
