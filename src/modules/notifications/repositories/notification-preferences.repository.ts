import type {
  EvaluateNotificationCommand,
  GlobalPolicy,
  PreferenceSetting,
  QuietHours,
} from '../domain/notification-preferences.types';

export const NOTIFICATION_PREFERENCES_REPOSITORY = Symbol(
  'NOTIFICATION_PREFERENCES_REPOSITORY',
);

export interface NotificationPreferencesRepository {
  initialize?(): Promise<void>;
  close?(): Promise<void>;
  getDefaultPreferences(): Promise<PreferenceSetting[]>;
  getUserPreferences(userId: string): Promise<PreferenceSetting[]>;
  upsertUserPreference(
    userId: string,
    preference: PreferenceSetting,
  ): Promise<void>;
  getQuietHours(userId: string): Promise<QuietHours | null>;
  upsertQuietHours(userId: string, quietHours: QuietHours): Promise<void>;
  findDenyPolicy(
    command: EvaluateNotificationCommand,
  ): Promise<GlobalPolicy | null>;
}
