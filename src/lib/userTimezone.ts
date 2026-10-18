const TZ_PATTERN = /^(UTC|[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+){1,2})$/;

export function getBrowserTimezone(): string | undefined {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (typeof tz === "string" && tz.length <= 64 && TZ_PATTERN.test(tz)) return tz;
  } catch {
    return undefined;
  }
  return undefined;
}

export function withTimezone<T extends Record<string, unknown>>(body: T): T & { timezone?: string } {
  const timezone = getBrowserTimezone();
  return timezone ? { ...body, timezone } : body;
}
