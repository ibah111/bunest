export const NOTIFICATION_CHANNELS = [
  'email',
  'sms',
  'messenger',
  'push',
] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_TYPES = [
  'transactional_email',
  'transactional_sms',
  'transactional_messenger',
  'transactional_push',
  'marketing_email',
  'marketing_sms',
  'marketing_messenger',
  'marketing_push',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const REGIONS = ['EU', 'US', 'APAC', 'LATAM', 'GLOBAL'] as const;

export type Region = (typeof REGIONS)[number];

export const NOTIFICATION_TYPE_CHANNEL: Record<
  NotificationType,
  NotificationChannel
> = {
  transactional_email: 'email',
  transactional_sms: 'sms',
  transactional_messenger: 'messenger',
  transactional_push: 'push',
  marketing_email: 'email',
  marketing_sms: 'sms',
  marketing_messenger: 'messenger',
  marketing_push: 'push',
};

export type PreferenceSource = 'default' | 'user';

export type Decision = 'allow' | 'deny';

export type DecisionReason =
  | 'allowed'
  | 'blocked_by_global_policy'
  | 'blocked_by_quiet_hours'
  | 'disabled_by_user_preference'
  | 'disabled_by_default_preference';

export type PreferenceSetting = {
  notificationType: NotificationType;
  channel: NotificationChannel;
  enabled: boolean;
};

export type ResolvedPreference = PreferenceSetting & {
  source: PreferenceSource;
};

export type QuietHours = {
  enabled: boolean;
  start: string;
  end: string;
  timezone: string;
};

export type UserPreferencesView = {
  userId: string;
  preferences: ResolvedPreference[];
  quietHours: QuietHours | null;
};

export type UpdatePreferencesCommand = {
  preferences: PreferenceSetting[];
  quietHours?: QuietHours;
};

export type EvaluateNotificationCommand = {
  userId: string;
  notificationType: NotificationType;
  channel: NotificationChannel;
  region: Region;
  datetime: Date;
};

export type EvaluationResult = {
  decision: Decision;
  reason: DecisionReason;
};

export type GlobalPolicy = {
  id: string;
  notificationType: NotificationType;
  channel: NotificationChannel | null;
  region: Region | null;
  effect: 'deny';
  reason: Extract<DecisionReason, 'blocked_by_global_policy'>;
  enabled: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: PreferenceSetting[] = [
  { notificationType: 'transactional_email', channel: 'email', enabled: true },
  { notificationType: 'transactional_sms', channel: 'sms', enabled: true },
  {
    notificationType: 'transactional_messenger',
    channel: 'messenger',
    enabled: true,
  },
  { notificationType: 'transactional_push', channel: 'push', enabled: true },
  { notificationType: 'marketing_email', channel: 'email', enabled: false },
  { notificationType: 'marketing_sms', channel: 'sms', enabled: false },
  {
    notificationType: 'marketing_messenger',
    channel: 'messenger',
    enabled: false,
  },
  { notificationType: 'marketing_push', channel: 'push', enabled: false },
];

export const DEFAULT_GLOBAL_POLICIES: GlobalPolicy[] = [
  {
    id: 'deny-marketing-sms-eu',
    notificationType: 'marketing_sms',
    channel: 'sms',
    region: 'EU',
    effect: 'deny',
    reason: 'blocked_by_global_policy',
    enabled: true,
  },
];

export function isNotificationType(value: unknown): value is NotificationType {
  return (
    typeof value === 'string' &&
    (NOTIFICATION_TYPES as readonly string[]).includes(value)
  );
}

export function isNotificationChannel(
  value: unknown,
): value is NotificationChannel {
  return (
    typeof value === 'string' &&
    (NOTIFICATION_CHANNELS as readonly string[]).includes(value)
  );
}

export function isRegion(value: unknown): value is Region {
  return (
    typeof value === 'string' && (REGIONS as readonly string[]).includes(value)
  );
}

export function isCompatibleNotificationPair(
  notificationType: NotificationType,
  channel: NotificationChannel,
): boolean {
  return NOTIFICATION_TYPE_CHANNEL[notificationType] === channel;
}

export function isQuietHoursSensitiveType(
  notificationType: NotificationType,
): boolean {
  return notificationType.startsWith('marketing_');
}

export function preferenceKey(setting: PreferenceSetting): string {
  return `${setting.notificationType}:${setting.channel}`;
}
