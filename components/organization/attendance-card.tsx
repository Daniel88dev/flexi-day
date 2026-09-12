"use client";

import { useState } from "react";
import Link from "next/link";
import { Info, Lock, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { pushToast } from "@/components/toast";
import {
  useAttendanceSettings,
  useBankHolidayCountries,
  useUpdateAttendanceSettings,
} from "@/lib/api/queries";
import type { AttendanceSettings, BalanceMode } from "@/lib/api/attendance-settings";
import type { OrganizationDetail } from "@/lib/api/organization";
import { formatMinutes, parseMinutes } from "@/lib/attendance/duration";
import { browserTimezone, listTimezones } from "@/lib/attendance/timezones";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

// Radix Select refuses an empty item value, so "off" travels as a sentinel.
const NO_HOLIDAY_COUNTRY = "NONE";

const displayIndexToWeekday = (i: number) => (i + 1) % 7;

export function AttendanceCard({
  detail,
  organizationId,
}: {
  detail: OrganizationDetail;
  organizationId: string | null;
}) {
  const settingsQuery = useAttendanceSettings(organizationId);

  // A backend predating attendance answers nothing useful — no card at all
  // beats a form whose save the server would reject.
  if (settingsQuery.isPending || settingsQuery.error || !settingsQuery.data) return null;

  return (
    // Keyed on the row's identity: the form seeds `useState` from the payload,
    // so a switch into another organization must remount rather than carry the
    // previous one's rules into its Save.
    <AttendanceForm
      key={settingsQuery.data.organizationId}
      detail={detail}
      organizationId={organizationId}
      settings={settingsQuery.data}
    />
  );
}

function AttendanceForm({
  detail,
  organizationId,
  settings,
}: {
  detail: OrganizationDetail;
  organizationId: string | null;
  settings: AttendanceSettings;
}) {
  const { t } = useTranslation();
  const update = useUpdateAttendanceSettings(organizationId);
  const countriesQuery = useBankHolidayCountries();

  const [enabled, setEnabled] = useState(settings.attendanceEnabled);
  const [locationEnabled, setLocationEnabled] = useState(settings.locationEnabled);
  // Only a proposal: nothing is stored until Save, and this is the one field
  // with no default to fall back on.
  const [timezone, setTimezone] = useState(settings.timezone ?? browserTimezone() ?? "");
  const [holidayCountry, setHolidayCountry] = useState(
    settings.holidayCountry ?? NO_HOLIDAY_COUNTRY
  );
  const [workingDays, setWorkingDays] = useState<Set<number>>(() => new Set(settings.workingDays));
  const [breakMinutes, setBreakMinutes] = useState(String(settings.breakMinutes));
  const [breakThreshold, setBreakThreshold] = useState(
    formatMinutes(settings.breakThresholdMinutes)
  );
  const [requiredPerDay, setRequiredPerDay] = useState(
    formatMinutes(settings.requiredMinutesPerDay)
  );
  const [balanceMode, setBalanceMode] = useState<BalanceMode>(settings.balanceMode);
  const [sessionCeiling, setSessionCeiling] = useState(
    formatMinutes(settings.sessionCeilingMinutes)
  );
  const [breakCeiling, setBreakCeiling] = useState(formatMinutes(settings.breakCeilingMinutes));
  const [error, setError] = useState<string | null>(null);

  const paid = detail.plan.plan !== "FREE";
  // A lapsed organization keeps its settings readable and editable; only
  // switching the feature back on needs the plan again.
  const canEnable = paid || settings.attendanceEnabled;
  const zones = listTimezones();

  if (!canEnable && !enabled) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-4 w-4" aria-hidden />
            {t.organization.attendance.title}
          </CardTitle>
          <Switch
            aria-label={t.organization.attendance.switchLabel}
            checked={false}
            disabled
            onCheckedChange={() => undefined}
          />
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">{t.organization.attendance.lead}</p>
          <div className="border-primary/30 bg-primary/5 flex gap-3 rounded-xl border p-4">
            <Lock className="text-primary mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div className="space-y-2">
              <p className="font-semibold">{t.organization.attendance.paidOnlyTitle}</p>
              <p className="text-muted-foreground text-sm">
                {t.organization.attendance.paidOnlyBody}
              </p>
              <Button asChild size="sm" variant="outline">
                <Link href="/billing">{t.organization.attendance.seePlans}</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function toggleWorkingDay(weekday: number) {
    setError(null);
    setWorkingDays((prev) => {
      const next = new Set(prev);
      if (next.has(weekday)) next.delete(weekday);
      else next.add(weekday);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (enabled && !timezone) {
      setError(t.organization.attendance.timezoneRequired);
      return;
    }
    if (workingDays.size === 0) {
      setError(t.organization.attendance.workingDaysRequired);
      return;
    }

    const durations = {
      breakThresholdMinutes: parseMinutes(breakThreshold),
      requiredMinutesPerDay: parseMinutes(requiredPerDay),
      sessionCeilingMinutes: parseMinutes(sessionCeiling),
      breakCeilingMinutes: parseMinutes(breakCeiling),
    };
    const allowance = Number(breakMinutes);
    if (
      Object.values(durations).some((value) => value === null) ||
      !Number.isInteger(allowance) ||
      allowance < 0
    ) {
      setError(t.organization.attendance.durationInvalid);
      return;
    }

    try {
      await update.mutateAsync({
        attendanceEnabled: enabled,
        locationEnabled,
        timezone: timezone || null,
        holidayCountry: holidayCountry === NO_HOLIDAY_COUNTRY ? null : holidayCountry,
        workingDays: Array.from(workingDays).sort((a, b) => a - b),
        breakMinutes: allowance,
        breakThresholdMinutes: durations.breakThresholdMinutes!,
        requiredMinutesPerDay: durations.requiredMinutesPerDay!,
        balanceMode,
        sessionCeilingMinutes: durations.sessionCeilingMinutes!,
        breakCeilingMinutes: durations.breakCeilingMinutes!,
      });
      pushToast(t.organization.attendance.saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.organization.attendance.saveFailed);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-4 w-4" aria-hidden />
          {t.organization.attendance.title}
        </CardTitle>
        <Switch
          id="attendanceEnabled"
          aria-label={t.organization.attendance.switchLabel}
          checked={enabled}
          disabled={update.isPending || (!canEnable && !enabled)}
          onCheckedChange={(next) => {
            setError(null);
            setEnabled(next);
          }}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          {enabled
            ? t.organization.attendance.leadOn(detail.organization.name)
            : t.organization.attendance.lead}
        </p>

        {settings.attendanceEnabled && !settings.active ? (
          <p className="text-destructive text-sm">{t.organization.attendance.dormant}</p>
        ) : null}

        {enabled ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <Field
                label={t.organization.attendance.timezoneLabel}
                htmlFor="attendanceTimezone"
                hint={t.organization.attendance.timezoneHint}
              >
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="attendanceTimezone" className="w-full">
                    <SelectValue placeholder={t.organization.attendance.timezonePlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Keeps a stored zone visible on an engine whose list does
                        not carry it — otherwise the trigger renders blank. */}
                    {timezone && !zones.includes(timezone) ? (
                      <SelectItem value={timezone}>{timezone}</SelectItem>
                    ) : null}
                    {zones.map((zone) => (
                      <SelectItem key={zone} value={zone}>
                        {zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label={t.organization.attendance.holidayCountryLabel}
                htmlFor="attendanceHolidayCountry"
                hint={t.organization.attendance.holidayCountryHint}
              >
                <Select value={holidayCountry} onValueChange={setHolidayCountry}>
                  <SelectTrigger id="attendanceHolidayCountry" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_HOLIDAY_COUNTRY}>
                      {t.organization.attendance.holidayCountryNone}
                    </SelectItem>
                    {holidayCountry !== NO_HOLIDAY_COUNTRY &&
                    !(countriesQuery.data ?? []).some((c) => c.code === holidayCountry) ? (
                      <SelectItem value={holidayCountry}>{holidayCountry}</SelectItem>
                    ) : null}
                    {(countriesQuery.data ?? []).map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name} ({country.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label={t.organization.attendance.workingDaysLabel}
                hint={t.organization.attendance.workingDaysHint}
              >
                <div className="flex flex-wrap gap-1.5">
                  {t.calendar.weekdaysShort.map((label, i) => {
                    const weekday = displayIndexToWeekday(i);
                    const active = workingDays.has(weekday);
                    return (
                      <button
                        key={weekday}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleWorkingDay(weekday)}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:ring-foreground/30 hover:ring-1"
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>

            <Subhead>{t.organization.attendance.breaksHeading}</Subhead>
            <div className="grid gap-4 md:grid-cols-3">
              <Field
                label={t.organization.attendance.breakAllowanceLabel}
                htmlFor="attendanceBreakMinutes"
                hint={t.organization.attendance.breakAllowanceHint}
              >
                <Input
                  id="attendanceBreakMinutes"
                  inputMode="numeric"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(e.target.value)}
                />
              </Field>
              <Field
                label={t.organization.attendance.breakThresholdLabel}
                htmlFor="attendanceBreakThreshold"
                hint={t.organization.attendance.breakThresholdHint}
              >
                <Input
                  id="attendanceBreakThreshold"
                  placeholder={t.organization.attendance.durationHint}
                  value={breakThreshold}
                  onChange={(e) => setBreakThreshold(e.target.value)}
                />
              </Field>
            </div>

            <Subhead>{t.organization.attendance.requiredHeading}</Subhead>
            <div className="grid gap-4 md:grid-cols-3">
              <Field
                label={t.organization.attendance.requiredPerDayLabel}
                htmlFor="attendanceRequiredPerDay"
                hint={t.organization.attendance.requiredPerDayHint}
              >
                <Input
                  id="attendanceRequiredPerDay"
                  placeholder={t.organization.attendance.durationHint}
                  value={requiredPerDay}
                  onChange={(e) => setRequiredPerDay(e.target.value)}
                />
              </Field>
              <Field
                label={t.organization.attendance.balanceLabel}
                hint={t.organization.attendance.balanceHint}
                className="md:col-span-2"
              >
                <div
                  role="group"
                  aria-label={t.organization.attendance.balanceLabel}
                  className="bg-muted inline-flex rounded-full p-0.5"
                >
                  {(
                    [
                      ["DAILY", t.organization.attendance.balanceDaily],
                      ["MONTHLY", t.organization.attendance.balanceMonthly],
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      aria-pressed={balanceMode === mode}
                      onClick={() => setBalanceMode(mode)}
                      className={cn(
                        "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                        balanceMode === mode
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <Subhead>{t.organization.attendance.ceilingsHeading}</Subhead>
            <div className="grid gap-4 md:grid-cols-3">
              <Field
                label={t.organization.attendance.sessionCeilingLabel}
                htmlFor="attendanceSessionCeiling"
                hint={t.organization.attendance.sessionCeilingHint}
              >
                <Input
                  id="attendanceSessionCeiling"
                  placeholder={t.organization.attendance.durationHint}
                  value={sessionCeiling}
                  onChange={(e) => setSessionCeiling(e.target.value)}
                />
              </Field>
              <Field
                label={t.organization.attendance.breakCeilingLabel}
                htmlFor="attendanceBreakCeiling"
                hint={t.organization.attendance.breakCeilingHint}
              >
                <Input
                  id="attendanceBreakCeiling"
                  placeholder={t.organization.attendance.durationHint}
                  value={breakCeiling}
                  onChange={(e) => setBreakCeiling(e.target.value)}
                />
              </Field>
            </div>

            <div className="border-border space-y-3 rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <Label htmlFor="attendanceLocation">
                    {t.organization.attendance.locationLabel}
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    {t.organization.attendance.locationHint}
                  </p>
                </div>
                <Switch
                  id="attendanceLocation"
                  checked={locationEnabled}
                  onCheckedChange={setLocationEnabled}
                />
              </div>
              <div className="bg-muted/50 flex gap-3 rounded-lg p-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    {t.organization.attendance.locationResponsibilityTitle}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {t.organization.attendance.locationResponsibilityBody}{" "}
                    <Link href="/privacy" className="underline">
                      {t.organization.attendance.locationReadPrivacy}
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {error ? <p className="text-destructive text-sm">{error}</p> : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? t.organization.saving : t.organization.save}
              </Button>
              <span className="text-muted-foreground text-xs">
                {t.organization.attendance.saveHint}
              </span>
            </div>
          </form>
        ) : settings.attendanceEnabled ? (
          // Switched off but not yet saved: the Save is what actually turns the
          // feature off, so it has to stay reachable with the rules hidden.
          <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? t.organization.saving : t.organization.save}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Subhead({ children }: { children: React.ReactNode }) {
  return <div className="border-border border-t pt-3 text-sm font-semibold">{children}</div>;
}

function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {htmlFor ? (
        <Label htmlFor={htmlFor}>{label}</Label>
      ) : (
        <span className="text-sm leading-none font-medium">{label}</span>
      )}
      {children}
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  );
}
