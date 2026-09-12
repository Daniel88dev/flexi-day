/** The zone the browser is in, proposed when no timezone has been chosen yet. */
export function browserTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/**
 * Every IANA zone the browser knows, falling back to its own zone on an engine
 * without `Intl.supportedValuesOf` — the picker is never empty.
 */
export function listTimezones(): string[] {
  const supported = (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
  if (typeof supported === "function") {
    try {
      return supported("timeZone");
    } catch {
      // Falls through to the browser's own zone.
    }
  }
  const own = browserTimezone();
  return own ? [own] : [];
}
