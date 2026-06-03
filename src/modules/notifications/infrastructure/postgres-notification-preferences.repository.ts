import { Injectable } from '@nestjs/common';
import {
  DEFAULT_GLOBAL_POLICIES,
  DEFAULT_NOTIFICATION_PREFERENCES,
  type EvaluateNotificationCommand,
  type GlobalPolicy,
  type NotificationChannel,
  type NotificationType,
  type PreferenceSetting,
  type QuietHours,
  type Region,
} from '../domain/notification-preferences.types';
import type { NotificationPreferencesRepository } from '../repositories/notification-preferences.repository';

type SqlClient = {
  <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]>;
  unsafe<T = Record<string, unknown>>(
    query: string,
    values?: unknown[],
  ): Promise<T[]>;
  close(): Promise<void>;
};

type PreferenceRow = {
  notification_type: string;
  channel: string;
  enabled: boolean;
};

type QuietHoursRow = {
  enabled: boolean;
  start_time: string;
  end_time: string;
  timezone: string;
};

type GlobalPolicyRow = {
  id: string;
  notification_type: string;
  channel: string | null;
  region: string | null;
  effect: 'deny';
  reason: 'blocked_by_global_policy';
  enabled: boolean;
};

const MIGRATIONS = [
  {
    id: '202606020001_create_notification_preferences',
    queries: [
      `
        CREATE TABLE IF NOT EXISTS notification_schema_migrations (
          id text PRIMARY KEY,
          applied_at timestamptz NOT NULL DEFAULT now()
        )
      `,
      `
        CREATE TABLE IF NOT EXISTS default_notification_preferences (
          notification_type text NOT NULL,
          channel text NOT NULL,
          enabled boolean NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (notification_type, channel)
        )
      `,
      `
        CREATE TABLE IF NOT EXISTS user_notification_preferences (
          user_id text NOT NULL,
          notification_type text NOT NULL,
          channel text NOT NULL,
          enabled boolean NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (user_id, notification_type, channel)
        )
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id
          ON user_notification_preferences (user_id)
      `,
      `
        CREATE TABLE IF NOT EXISTS user_quiet_hours (
          user_id text PRIMARY KEY,
          enabled boolean NOT NULL,
          start_time time NOT NULL,
          end_time time NOT NULL,
          timezone text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `,
      `
        CREATE TABLE IF NOT EXISTS global_notification_policies (
          id text PRIMARY KEY,
          notification_type text NOT NULL,
          channel text NULL,
          region text NULL,
          effect text NOT NULL CHECK (effect = 'deny'),
          reason text NOT NULL,
          enabled boolean NOT NULL DEFAULT true,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_global_notification_policies_lookup
          ON global_notification_policies (
            notification_type,
            channel,
            region,
            enabled
          )
      `,
    ],
  },
];

@Injectable()
export class PostgresNotificationPreferencesRepository
  implements NotificationPreferencesRepository
{
  private readonly sql: SqlClient;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL is required when NOTIFICATIONS_STORAGE is not "memory"',
      );
    }

    this.sql = new Bun.SQL(databaseUrl) as unknown as SqlClient;
  }

  async initialize(): Promise<void> {
    await this.runMigrations();
    await this.seedDefaultPreferences();
    await this.seedGlobalPolicies();
  }

  async close(): Promise<void> {
    await this.sql.close();
  }

  async getDefaultPreferences(): Promise<PreferenceSetting[]> {
    const rows = await this.sql<PreferenceRow>`
      SELECT notification_type, channel, enabled
      FROM default_notification_preferences
    `;

    return rows.map((row) => this.mapPreference(row));
  }

  async getUserPreferences(userId: string): Promise<PreferenceSetting[]> {
    const rows = await this.sql<PreferenceRow>`
      SELECT notification_type, channel, enabled
      FROM user_notification_preferences
      WHERE user_id = ${userId}
    `;

    return rows.map((row) => this.mapPreference(row));
  }

  async upsertUserPreference(
    userId: string,
    preference: PreferenceSetting,
  ): Promise<void> {
    await this.sql`
      INSERT INTO user_notification_preferences (
        user_id,
        notification_type,
        channel,
        enabled
      )
      VALUES (
        ${userId},
        ${preference.notificationType},
        ${preference.channel},
        ${preference.enabled}
      )
      ON CONFLICT (user_id, notification_type, channel)
      DO UPDATE SET
        enabled = EXCLUDED.enabled,
        updated_at = now()
    `;
  }

  async getQuietHours(userId: string): Promise<QuietHours | null> {
    const rows = await this.sql<QuietHoursRow>`
      SELECT
        enabled,
        start_time::text AS start_time,
        end_time::text AS end_time,
        timezone
      FROM user_quiet_hours
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    const quietHours = rows[0];

    if (!quietHours) {
      return null;
    }

    return {
      enabled: quietHours.enabled,
      start: this.formatDbTime(quietHours.start_time),
      end: this.formatDbTime(quietHours.end_time),
      timezone: quietHours.timezone,
    };
  }

  async upsertQuietHours(
    userId: string,
    quietHours: QuietHours,
  ): Promise<void> {
    await this.sql`
      INSERT INTO user_quiet_hours (
        user_id,
        enabled,
        start_time,
        end_time,
        timezone
      )
      VALUES (
        ${userId},
        ${quietHours.enabled},
        ${quietHours.start},
        ${quietHours.end},
        ${quietHours.timezone}
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        enabled = EXCLUDED.enabled,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        timezone = EXCLUDED.timezone,
        updated_at = now()
    `;
  }

  async findDenyPolicy(
    command: EvaluateNotificationCommand,
  ): Promise<GlobalPolicy | null> {
    const rows = await this.sql<GlobalPolicyRow>`
      SELECT
        id,
        notification_type,
        channel,
        region,
        effect,
        reason,
        enabled
      FROM global_notification_policies
      WHERE enabled = true
        AND effect = 'deny'
        AND notification_type = ${command.notificationType}
        AND (channel IS NULL OR channel = ${command.channel})
        AND (region IS NULL OR region = ${command.region})
      ORDER BY
        CASE WHEN channel IS NULL THEN 0 ELSE 1 END DESC,
        CASE WHEN region IS NULL THEN 0 ELSE 1 END DESC
      LIMIT 1
    `;

    const policy = rows[0];

    if (!policy) {
      return null;
    }

    return {
      id: policy.id,
      notificationType: policy.notification_type as NotificationType,
      channel: policy.channel as NotificationChannel | null,
      region: policy.region as Region | null,
      effect: policy.effect,
      reason: policy.reason,
      enabled: policy.enabled,
    };
  }

  private async runMigrations(): Promise<void> {
    await this.sql.unsafe(`
      CREATE TABLE IF NOT EXISTS notification_schema_migrations (
        id text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    for (const migration of MIGRATIONS) {
      const rows = await this.sql<{ id: string }>`
        SELECT id
        FROM notification_schema_migrations
        WHERE id = ${migration.id}
        LIMIT 1
      `;

      if (rows.length > 0) {
        continue;
      }

      for (const query of migration.queries) {
        await this.sql.unsafe(query);
      }

      await this.sql`
        INSERT INTO notification_schema_migrations (id)
        VALUES (${migration.id})
        ON CONFLICT (id) DO NOTHING
      `;
    }
  }

  private async seedDefaultPreferences(): Promise<void> {
    for (const preference of DEFAULT_NOTIFICATION_PREFERENCES) {
      await this.sql`
        INSERT INTO default_notification_preferences (
          notification_type,
          channel,
          enabled
        )
        VALUES (
          ${preference.notificationType},
          ${preference.channel},
          ${preference.enabled}
        )
        ON CONFLICT (notification_type, channel)
        DO UPDATE SET
          enabled = EXCLUDED.enabled,
          updated_at = now()
      `;
    }
  }

  private async seedGlobalPolicies(): Promise<void> {
    for (const policy of DEFAULT_GLOBAL_POLICIES) {
      await this.sql`
        INSERT INTO global_notification_policies (
          id,
          notification_type,
          channel,
          region,
          effect,
          reason,
          enabled
        )
        VALUES (
          ${policy.id},
          ${policy.notificationType},
          ${policy.channel},
          ${policy.region},
          ${policy.effect},
          ${policy.reason},
          ${policy.enabled}
        )
        ON CONFLICT (id)
        DO UPDATE SET
          notification_type = EXCLUDED.notification_type,
          channel = EXCLUDED.channel,
          region = EXCLUDED.region,
          effect = EXCLUDED.effect,
          reason = EXCLUDED.reason,
          enabled = EXCLUDED.enabled,
          updated_at = now()
      `;
    }
  }

  private mapPreference(row: PreferenceRow): PreferenceSetting {
    return {
      notificationType: row.notification_type as NotificationType,
      channel: row.channel as NotificationChannel,
      enabled: row.enabled,
    };
  }

  private formatDbTime(value: string): string {
    return value.slice(0, 5);
  }
}
