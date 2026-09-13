"use client";

import type { AttendanceBalanceMode, AttendanceDay } from "@/lib/api/attendance";
import { formatMinutes, formatSignedMinutes } from "@/lib/attendance/duration";
import { weekTotals } from "@/lib/attendance/month";
import { useTranslation } from "@/lib/i18n/use-translation";
import { DayFigures, Stat, StatRow, excludedSurface, isExcluded } from "./attendance-figures";

/** The weekday and day-of-month of a business date, in the reader's language. */
function DayLabel({ businessDate, locale }: { businessDate: string; locale: string }) {
  const date = new Date(`${businessDate}T12:00:00Z`);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(
    date
  );
  const day = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);

  return (
    <div className="mb-1.5 flex flex-col">
      <span className="text-sm font-semibold capitalize">{weekday}</span>
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
        {day}
      </span>
    </div>
  );
}

function WeekDay({
  day,
  mode,
  today,
  locale,
}: {
  day: AttendanceDay;
  mode: AttendanceBalanceMode;
  today: string | null;
  locale: string;
}) {
  const { t } = useTranslation();
  const excluded = isExcluded(day);

  return (
    <li
      data-testid={`week-day-${day.businessDate}`}
      className="flex flex-col gap-0.5 rounded-2xl border p-3"
      style={{
        borderColor: day.businessDate === today ? "var(--primary)" : "var(--border)",
        borderStyle: day.upcoming && !excluded ? "dashed" : "solid",
        ...(excluded ? excludedSurface : {}),
      }}
    >
      <DayLabel businessDate={day.businessDate} locale={locale} />

      {/* A day off says so whether or not it has arrived: nothing about next
          Saturday is still to be decided. */}
      {day.upcoming && !excluded ? (
        <span className="text-sm" style={{ color: "var(--text-faint)" }}>
          {t.clock.upcoming}
        </span>
      ) : (
        <DayFigures day={day} mode={mode} today={today} size="lg" />
      )}
    </li>
  );
}

/**
 * One week, Monday to Sunday. Its totals are read the way the month's are —
 * required counts only the days already begun, so the rest of the week is not a
 * shortfall.
 */
export function WeekView({
  days,
  mode,
  today,
  locale,
}: {
  days: AttendanceDay[];
  mode: AttendanceBalanceMode;
  today: string | null;
  locale: string;
}) {
  const { t } = useTranslation();
  const totals = weekTotals(days);

  return (
    <div className="flex flex-col gap-4">
      <StatRow>
        <Stat label={t.clock.worked} value={formatMinutes(totals.workedMinutes)} />
        <Stat label={t.clock.required} value={formatMinutes(totals.requiredMinutes)} />
        <Stat label={t.clock.balance} value={formatSignedMinutes(totals.balanceMinutes)} />
        <Stat
          label={t.clock.flagged}
          value={String(totals.flaggedDays)}
          sub={t.clock.daysToCheck}
        />
      </StatRow>

      {days.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {t.clock.emptyWeek}
        </p>
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {days.map((day) => (
              <WeekDay key={day.businessDate} day={day} mode={mode} today={today} locale={locale} />
            ))}
          </ul>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            {t.clock.hatchedLegend}
          </p>
        </>
      )}
    </div>
  );
}
