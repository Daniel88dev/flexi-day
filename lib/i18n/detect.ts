import { DEFAULT_LOCALE, isLocale, STORAGE_KEY, type Locale } from "./config";

/**
 * Pure locale resolution: an explicit stored choice always wins; otherwise the
 * browser/system language decides (Czech → cs, anything else → the default).
 * Kept free of globals so it is trivially unit-testable.
 */
export function resolveInitialLocale(
  stored: string | null | undefined,
  navigatorLang: string | null | undefined
): Locale {
  if (isLocale(stored)) return stored;
  if (typeof navigatorLang === "string" && navigatorLang.toLowerCase().startsWith("cs")) {
    return "cs";
  }
  return DEFAULT_LOCALE;
}

/** Client-only wrapper that feeds localStorage + navigator into {@link resolveInitialLocale}. */
export function detectLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Access to localStorage can throw (private mode, blocked cookies) — fall back to detection.
  }
  return resolveInitialLocale(stored, window.navigator?.language);
}
