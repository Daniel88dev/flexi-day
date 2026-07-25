"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * Two-locale switch that sits beside {@link ModeToggle}. Shows the current
 * language code and flips to the other on click, persisting via the provider.
 */
export function LocaleToggle() {
  const { locale, setLocale, t } = useTranslation();
  const next = locale === "en" ? "cs" : "en";
  const label = next === "cs" ? t.locale.switchToCzech : t.locale.switchToEnglish;

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={() => setLocale(next)}
      aria-label={label}
      title={label}
    >
      <span className="text-[11px] font-bold tracking-wide uppercase">{locale}</span>
      <span className="sr-only">{t.locale.toggleLabel}</span>
    </Button>
  );
}
