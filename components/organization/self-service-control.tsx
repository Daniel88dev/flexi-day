"use client";

import { CalendarDays, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { addDays } from "@/lib/attendance/month";
import {
  businessDateIn,
  selfServiceDaysOf,
  selfServiceMode,
  type SelfServiceDraft,
} from "@/lib/attendance/self-service";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

function windowRange(days: number, timezone: string, locale: string): string {
  const today = businessDateIn(new Date(), timezone);
  const at = (iso: string) => new Date(`${iso}T12:00:00Z`);
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).formatRange(at(addDays(today, -days)), at(today));
}

/**
 * The self-service block of the organization's attendance card: the switch,
 * how far back, and a plain line saying what employees can do with the
 * setting as it stands.
 */
export function SelfServiceControl({
  draft,
  onChange,
  organizationName,
  timezone,
}: {
  draft: SelfServiceDraft;
  onChange: (draft: SelfServiceDraft) => void;
  organizationName: string;
  /** The zone "today" is read in; the form's own, falling back to UTC before one is chosen. */
  timezone: string;
}) {
  const { t, locale } = useTranslation();
  const copy = t.organization.attendance;
  const days = selfServiceDaysOf(draft);
  const invalid = draft.enabled && days === undefined;

  const explanation = (() => {
    if (invalid) return null;
    // Hidden while off, so an unreadable number there says nothing about the mode.
    const back = days === undefined ? 0 : days;
    switch (selfServiceMode({ enabled: draft.enabled, days: back })) {
      case "OFF":
        return copy.selfServiceOffBody;
      case "NO_LIMIT":
        return copy.selfServiceNoLimitBody;
      case "TODAY":
        return copy.selfServiceZeroBody;
      case "DAYS":
        return copy.selfServiceDaysBody(back ?? 0, windowRange(back ?? 0, timezone, locale));
    }
  })();

  return (
    <div className="border-border space-y-3 rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <Label htmlFor="attendanceSelfService">{copy.selfServiceLabel}</Label>
          <p className="text-muted-foreground text-xs">{copy.selfServiceHint}</p>
        </div>
        <Switch
          id="attendanceSelfService"
          aria-label={copy.selfServiceSwitch}
          checked={draft.enabled}
          onCheckedChange={(enabled) => onChange({ ...draft, enabled })}
        />
      </div>

      {draft.enabled ? (
        <div className="flex flex-wrap items-start gap-3">
          <div
            role="group"
            aria-label={copy.selfServiceLimit}
            className="bg-muted inline-flex rounded-full p-0.5"
          >
            {(
              [
                [false, copy.selfServiceDaysBack],
                [true, copy.selfServiceNoLimit],
              ] as const
            ).map(([noLimit, label]) => (
              <button
                key={label}
                type="button"
                aria-pressed={draft.noLimit === noLimit}
                onClick={() => onChange({ ...draft, noLimit })}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                  draft.noLimit === noLimit
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {draft.noLimit ? null : (
            <div className="space-y-1">
              <Label htmlFor="attendanceSelfServiceDays" className="sr-only">
                {copy.selfServiceDaysLabel}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="attendanceSelfServiceDays"
                  inputMode="numeric"
                  className="w-24"
                  aria-invalid={invalid}
                  value={draft.days}
                  onChange={(e) => onChange({ ...draft, days: e.target.value })}
                />
                <span className="text-muted-foreground text-sm">{copy.selfServiceDaysUnit}</span>
              </div>
              {invalid ? (
                <p className="text-destructive text-xs">{copy.selfServiceDaysInvalid}</p>
              ) : (
                <p className="text-muted-foreground text-xs">{copy.selfServiceDaysHint}</p>
              )}
            </div>
          )}
        </div>
      ) : null}

      {explanation ? (
        <div className="bg-muted/50 flex gap-3 rounded-lg p-3">
          {draft.enabled ? (
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          )}
          <p className="text-sm">{explanation}</p>
        </div>
      ) : null}

      <p className="text-muted-foreground text-xs">{copy.selfServiceApplies(organizationName)}</p>
    </div>
  );
}
