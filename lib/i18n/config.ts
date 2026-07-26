export type Locale = "en" | "cs";

export const LOCALES: readonly Locale[] = ["en", "cs"] as const;

export const DEFAULT_LOCALE: Locale = "en";

/** localStorage key that persists the user's explicit language choice. */
export const STORAGE_KEY = "flexiday-locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
