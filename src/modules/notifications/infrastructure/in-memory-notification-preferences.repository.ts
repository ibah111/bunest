import { Injectable } from '@nestjs/common';
import {
  DEFAULT_GLOBAL_POLICIES,
  DEFAULT_NOTIFICATION_PREFERENCES,
  preferenceKey,
  type EvaluateNotificationCommand,
  type GlobalPolicy,
  type PreferenceSetting,
  type QuietHours,
} from '../domain/notification-preferences.types';
import type { NotificationPreferencesRepository } from '../repositories/notification-preferences.repository';

@Injectable()
export class InMemoryNotificationPreferencesRepository
  implements NotificationPreferencesRepository
{
  private defaultPreferences = [...DEFAULT_NOTIFICATION_PREFERENCES];
  private globalPolicies = [...DEFAULT_GLOBAL_POLICIES];
  private readonly userPreferences = new Map<string, PreferenceSetting>();
  private readonly quietHours = new Map<string, QuietHours>();

  async initialize(): Promise<void> {
    this.defaultPreferences = [...DEFAULT_NOTIFICATION_PREFERENCES];
    this.globalPolicies = [...DEFAULT_GLOBAL_POLICIES];
  }

  async getDefaultPreferences(): Promise<PreferenceSetting[]> {
    return this.defaultPreferences.map((preference) => ({ ...preference }));
  }

  async getUserPreferences(userId: string): Promise<PreferenceSetting[]> {
    return [...this.userPreferences.entries()]
      .filter(([key]) => key.startsWith(`${userId}|`))
      .map(([, preference]) => ({ ...preference }));
  }

  async upsertUserPreference(
    userId: string,
    preference: PreferenceSetting,
  ): Promise<void> {
    this.userPreferences.set(this.userPreferenceKey(userId, preference), {
      ...preference,
    });
  }

  async getQuietHours(userId: string): Promise<QuietHours | null> {
    const quietHours = this.quietHours.get(userId);
    return quietHours ? { ...quietHours } : null;
  }

  async upsertQuietHours(
    userId: string,
    quietHours: QuietHours,
  ): Promise<void> {
    this.quietHours.set(userId, { ...quietHours });
  }

  async findDenyPolicy(
    command: EvaluateNotificationCommand,
  ): Promise<GlobalPolicy | null> {
    const policies = this.globalPolicies
      .filter(
        (policy) =>
          policy.enabled &&
          policy.effect === 'deny' &&
          policy.notificationType === command.notificationType &&
          (policy.channel === null || policy.channel === command.channel) &&
          (policy.region === null || policy.region === command.region),
      )
      .sort((left, right) => this.specificity(right) - this.specificity(left));

    return policies[0] ? { ...policies[0] } : null;
  }

  private userPreferenceKey(
    userId: string,
    preference: PreferenceSetting,
  ): string {
    return `${userId}|${preferenceKey(preference)}`;
  }

  private specificity(policy: GlobalPolicy): number {
    return Number(policy.channel !== null) + Number(policy.region !== null);
  }
}
