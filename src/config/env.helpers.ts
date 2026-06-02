export function readBooleanEnv(
  value: string | undefined,
  defaultValue = false,
): boolean {
  if (value === undefined || value === '') {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export function readIntegerEnv(
  value: string | undefined,
  defaultValue: number,
): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

export function readStringEnv(
  value: string | undefined,
  defaultValue: string,
): string {
  return value && value.trim() ? value : defaultValue;
}
