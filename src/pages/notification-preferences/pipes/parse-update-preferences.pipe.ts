import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import type {
  PreferenceSetting,
  UpdatePreferencesCommand,
} from '@/modules/notifications/domain/notification-preferences.types';
import {
  parsePreferenceSetting,
  parseQuietHours,
  parseRecord,
} from './notification-input.parsers';

@Injectable()
export class ParseUpdatePreferencesPipe
  implements PipeTransform<unknown, UpdatePreferencesCommand>
{
  transform(value: unknown): UpdatePreferencesCommand {
    const body = parseRecord(value, 'body');
    const preferences: PreferenceSetting[] = [];

    if (body.preference !== undefined) {
      preferences.push(parsePreferenceSetting(body.preference, 'preference'));
    }

    if (body.preferences !== undefined) {
      if (!Array.isArray(body.preferences)) {
        throw new BadRequestException('preferences must be an array');
      }

      preferences.push(
        ...body.preferences.map((preference, index) =>
          parsePreferenceSetting(preference, `preferences[${index}]`),
        ),
      );
    }

    const quietHours =
      body.quietHours === undefined
        ? undefined
        : parseQuietHours(body.quietHours, 'quietHours');

    if (preferences.length === 0 && quietHours === undefined) {
      throw new BadRequestException(
        'body must include preference, preferences, or quietHours',
      );
    }

    return { preferences, quietHours };
  }
}
