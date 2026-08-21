"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useBankHolidayCountries,
  useUpdateGroupHolidayCountry,
  useUpdateGroupWorkingDays,
} from "@/lib/api/queries";
import type { Group } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * Group configuration that shapes how bookings behave — working days and the
 * public-holiday calendar. Deliberately separate from Quotas, which is about
 * allowances; these settings apply to every member regardless of allowance.
 */
export function SettingsTab({ group }: { group?: Group }) {
  return (
    // Keyed so switching groups remounts both forms instead of carrying the
    // previous group's selection into a save against the new one.
    <div key={group?.id} className="space-y-4">
      <GroupWorkingDaysCard group={group} />
      <GroupHolidayCountryCard group={group} />
    </div>
  );
}

// Display order is Monday-first (matching `weekdaysShort`); the stored values
// are `Date.getDay()` numbers (0=Sun … 6=Sat), so index i maps to (i + 1) % 7.
const displayIndexToWeekday = (i: number) => (i + 1) % 7;

function GroupWorkingDaysCard({ group }: { group?: Group }) {
  const { t } = useTranslation();
  const updateWorkingDays = useUpdateGroupWorkingDays();
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(group?.workingDays ?? [1, 2, 3, 4, 5])
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!group) return null;

  function toggle(weekday: number) {
    setSaved(false);
    setError(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(weekday)) next.delete(weekday);
      else next.add(weekday);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!group) return;
    setError(null);
    setSaved(false);
    if (selected.size === 0) {
      setError(t.groupDetail.workingDaysError);
      return;
    }
    try {
      await updateWorkingDays.mutateAsync({
        groupId: group.id,
        workingDays: Array.from(selected).sort((a, b) => a - b),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.groupDetail.saveWorkingDaysFailed);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.groupDetail.workingDays}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {t.calendar.weekdaysShort.map((label, i) => {
              const weekday = displayIndexToWeekday(i);
              const active = selected.has(weekday);
              return (
                <button
                  key={weekday}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(weekday)}
                  className={cn(
                    "rounded-full px-3 py-1 text-sm font-medium transition-colors",
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
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={updateWorkingDays.isPending}>
              {updateWorkingDays.isPending ? t.common.saving : t.groupDetail.saveWorkingDays}
            </Button>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            {saved && !error ? (
              <p className="text-sm text-green-700 dark:text-green-400">
                {t.groupDetail.workingDaysUpdated}
              </p>
            ) : null}
          </div>
        </form>
        <p className="text-muted-foreground mt-3 text-xs">{t.groupDetail.workingDaysNote}</p>
      </CardContent>
    </Card>
  );
}

// Radix Select refuses an empty item value, so "off" travels as a sentinel.
const NO_HOLIDAY_COUNTRY = "NONE";

function GroupHolidayCountryCard({ group }: { group?: Group }) {
  const { t } = useTranslation();
  const countriesQuery = useBankHolidayCountries();
  const updateHolidayCountry = useUpdateGroupHolidayCountry();
  const [selected, setSelected] = useState(group?.holidayCountry ?? NO_HOLIDAY_COUNTRY);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!group) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!group) return;
    setError(null);
    setSaved(false);
    try {
      await updateHolidayCountry.mutateAsync({
        groupId: group.id,
        holidayCountry: selected === NO_HOLIDAY_COUNTRY ? null : selected,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.groupDetail.saveHolidayCountryFailed);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.groupDetail.holidayCountry}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="holiday-country">{t.groupDetail.holidayCountryLabel}</Label>
            <Select
              value={selected}
              onValueChange={(value) => {
                setSaved(false);
                setError(null);
                setSelected(value);
              }}
            >
              <SelectTrigger id="holiday-country" className="w-full sm:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_HOLIDAY_COUNTRY}>
                  {t.groupDetail.holidayCountryNone}
                </SelectItem>
                {/* Keeps the saved code visible while the list loads or when
                    the endpoint fails — otherwise the trigger renders blank. */}
                {selected !== NO_HOLIDAY_COUNTRY &&
                !(countriesQuery.data ?? []).some((c) => c.code === selected) ? (
                  <SelectItem value={selected}>{selected}</SelectItem>
                ) : null}
                {(countriesQuery.data ?? []).map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={updateHolidayCountry.isPending}>
              {updateHolidayCountry.isPending ? t.common.saving : t.groupDetail.saveHolidayCountry}
            </Button>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            {saved && !error ? (
              <p className="text-sm text-green-700 dark:text-green-400">
                {t.groupDetail.holidayCountryUpdated}
              </p>
            ) : null}
          </div>
        </form>
        <p className="text-muted-foreground mt-3 text-xs">{t.groupDetail.holidayCountryNote}</p>
      </CardContent>
    </Card>
  );
}
