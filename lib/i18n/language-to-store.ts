import type { Locale } from "./config";

/**
 * The language to write to the signed-in user's settings, or null when nothing
 * should be written. `stored` is undefined when the backend predates the
 * setting, which would reject the write.
 */
export function languageToStore(stored: Locale | null | undefined, active: Locale): Locale | null {
  if (stored === undefined || stored === active) return null;
  return active;
}
