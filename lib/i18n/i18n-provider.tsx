"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, STORAGE_KEY, type Locale } from "./config";
import { detectLocale } from "./detect";
import { dictionaries, type Dictionary } from "./index";

interface I18nContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: Dictionary;
}

/**
 * Defaults to English so components that read the hook without a provider
 * (e.g. unit tests rendering a component in isolation) still render, and
 * render English — which keeps existing string-based test assertions valid.
 */
export const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: dictionaries[DEFAULT_LOCALE],
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // First render must match the statically-exported HTML (English) to avoid a
  // hydration mismatch; the mount effect then corrects to the detected locale.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    // Deliberate: the first render must match the statically-exported HTML
    // (English) to avoid a hydration mismatch, so we detect and switch only
    // after mount. This is the intended one-time correction, not a render loop.
    const detected = detectLocale();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(detected);
    document.documentElement.lang = detected;
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.documentElement.lang = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Persisting is best-effort; ignore storage failures (private mode etc.).
    }
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t: dictionaries[locale] }),
    [locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
