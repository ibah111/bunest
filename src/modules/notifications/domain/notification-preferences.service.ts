import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  isQuietHoursSensitiveType,
  preferenceKey,
  type EvaluateNotificationCommand,
  type EvaluationResult,
  type PreferenceSetting,
  type ResolvedPreference,
  type UpdatePreferencesCommand,
  type UserPreferencesView,
} from './notification-preferences.types';
import { isWithinQuietHours } from './quiet-hours';
import {
  NOTIFICATION_PREFERENCES_REPOSITORY,
  type NotificationPreferencesRepository,
} from '../repositories/notification-preferences.repository';

@Injectable()
export class NotificationPreferencesService {
  private readonly logger = new Logger(NotificationPreferencesService.name);

  constructor(
    @Inject(NOTIFICATION_PREFERENCES_REPOSITORY)
    private readonly repository: NotificationPreferencesRepository,
  ) {}

  async getPreferences(userId: string): Promise<UserPreferencesView> {
    const [defaults, userPreferences, quietHours] = await Promise.all([
      this.repository.getDefaultPreferences(),
      this.repository.getUserPreferences(userId),
      this.repository.getQuietHours(userId),
    ]);

    return {
      userId,
      preferences: this.resolvePreferences(defaults, userPreferences),
      quietHours,
    };
  }

  async updatePreferences(
    userId: string,
    command: UpdatePreferencesCommand,
  ): Promise<UserPreferencesView> {
    for (const preference of command.preferences) {
      await this.repository.upsertUserPreference(userId, preference);
    }

    if (command.quietHours) {
      await this.repository.upsertQuietHours(userId, command.quietHours);
    }

    this.logger.log(
      JSON.stringify({
        event: 'notification_preferences_updated',
        userId,
        preferenceChanges: command.preferences.length,
        quietHoursChanged: Boolean(command.quietHours),
      }),
    );

    return this.getPreferences(userId);
  }

  async evaluate(
    command: EvaluateNotificationCommand,
  ): Promise<EvaluationResult> {
    const result = await this.decide(command);

    this.logger.log(
      JSON.stringify({
        event: 'notification_delivery_evaluated',
        userId: command.userId,
        notificationType: command.notificationType,
        channel: command.channel,
        region: command.region,
        datetime: command.datetime.toISOString(),
        decision: result.decision,
        reason: result.reason,
      }),
    );

    return result;
  }

  private async decide(
    command: EvaluateNotificationCommand,
  ): Promise<EvaluationResult> {
    const policy = await this.repository.findDenyPolicy(command);

    if (policy) {
      return { decision: 'deny', reason: policy.reason };
    }

    const [defaults, userPreferences, quietHours] = await Promise.all([
      this.repository.getDefaultPreferences(),
      this.repository.getUserPreferences(command.userId),
      this.repository.getQuietHours(command.userId),
    ]);

    const preference = this.resolvePreference(
      { notificationType: command.notificationType, channel: command.channel },
      defaults,
      userPreferences,
    );

    if (!preference.enabled) {
      return {
        decision: 'deny',
        reason:
          preference.source === 'user'
            ? 'disabled_by_user_preference'
            : 'disabled_by_default_preference',
      };
    }

    if (
      quietHours &&
      isQuietHoursSensitiveType(command.notificationType) &&
      isWithinQuietHours(command.datetime, quietHours)
    ) {
      return { decision: 'deny', reason: 'blocked_by_quiet_hours' };
    }

    return { decision: 'allow', reason: 'allowed' };
  }

  private resolvePreferences(
    defaults: PreferenceSetting[],
    userPreferences: PreferenceSetting[],
  ): ResolvedPreference[] {
    const overrides = new Map(
      userPreferences.map((preference) => [preferenceKey(preference), preference]),
    );

    return defaults.map((defaultPreference) => {
      const override = overrides.get(preferenceKey(defaultPreference));

      return {
        ...defaultPreference,
        enabled: override?.enabled ?? defaultPreference.enabled,
        source: override ? 'user' : 'default',
      };
    });
  }

  private resolvePreference(
    key: Pick<PreferenceSetting, 'notificationType' | 'channel'>,
    defaults: PreferenceSetting[],
    userPreferences: PreferenceSetting[],
  ): ResolvedPreference {
    const preference = this.resolvePreferences(defaults, userPreferences).find(
      (setting) =>
        setting.notificationType === key.notificationType &&
        setting.channel === key.channel,
    );

    return (
      preference ?? {
        notificationType: key.notificationType,
        channel: key.channel,
        enabled: false,
        source: 'default',
      }
    );
  }
}
