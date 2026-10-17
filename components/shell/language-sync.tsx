"use client";

import { useEffect, useRef } from "react";
import { useMySettings, useUpdateMySettings } from "@/lib/api/queries";
import { languageToStore } from "@/lib/i18n/language-to-store";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * Keeps the signed-in user's stored language equal to the one the web shows,
 * so the backend can title their calendar events in it. Renders nothing.
 */
export function LanguageSync() {
  const { locale, localeReady } = useTranslation();
  const { data: settings } = useMySettings();
  const { mutate } = useUpdateMySettings();
  const sentRef = useRef<string | null>(null);

  const next = localeReady && settings ? languageToStore(settings.language, locale) : null;

  useEffect(() => {
    if (!next || sentRef.current === next) return;
    sentRef.current = next;
    mutate({ language: next });
  }, [next, mutate]);

  return null;
}
