"use client";

import type { AttendanceBalanceMode, AttendanceDay, AttendanceMonth } from "@/lib/api/attendance";
import { formatMinutes, formatSignedMinutes } from "@/lib/attendance/duration";
import { leadingBlanks } from "@/lib/attendance/month";
import { useTranslation } from "@/lib/i18n/use-translation";
import { DayFigures, Stat, StatRow, excludedSurface, isExcluded } from "./attendance-figures";

/** Monday-first weekday initials, from the reader's own locale. */
function weekdayHeadings(locale: string): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
  // 2026-06-01 is a Monday, so seven days from it are one week in order.
  return Array.from({ length: 7 }, (_, index) =>
    formatter.format(new Date(Date.UTC(2026, 5, 1 + index)))
  );
}

const dayNumber = (businessDate: string) => Number(businessDate.slice(8));

function MonthCell({
  day,
  mode,
  today,
}: {
  day: AttendanceDay;
  mode: AttendanceBalanceMode;
  today: string | null;
}) {
  const excluded = isExcluded(day);

  return (
    <div
      data-testid={`month-day-${day.businessDate}`}
      className="flex min-h-24 flex-col gap-0.5 rounded-xl border p-2"
      style={{
        borderColor: day.businessDate === today ? "var(--primary)" : "var(--border)",
        borderStyle: day.upcoming && !excluded ? "dashed" : "solid",
        ...(excluded ? excludedSurface : {}),
      }}
    >
      <span className="text-sm font-semibold tabular-nums">{dayNumber(day.businessDate)}</span>
      {day.upcoming && !excluded ? null : <DayFigures day={day} mode={mode} today={today} />}
    </div>
  );
}

/**
 * The month. A grid on anything wider than a phone — thirty rows do not fit a
 * laptop, and the grid keeps the totals and the whole month on one screen — and
 * the same days as a list below that, where seven columns would be unreadable.
 */
export function MonthView({ month, locale }: { month: AttendanceMonth; locale: string }) {
  const { t } = useTranslation();
  const mode = month.balanceMode;
  const today = month.businessDate;
  const totals = month.totals;
  const worked = month.days.some((day) => day.presenceMinutes > 0);
  // Days that were this Employment's to work: somebody who joined on the 15th
  // reads "2 of 16", not "2 of 30".
  const employedDays = month.days.filter((day) => day.exclusion?.cause !== "NOT_EMPLOYED").length;

  return (
    <div className="flex flex-col gap-4">
      <StatRow columns={5}>
        <Stat label={t.clock.worked} value={formatMinutes(totals.workedMinutes)} />
        <Stat label={t.clock.requiredSoFar} value={formatMinutes(totals.requiredMinutes)} />
        <Stat
          label={mode === "MONTHLY" ? t.clock.monthBalance : t.clock.balance}
          value={formatSignedMinutes(totals.balanceMinutes)}
          sub={t.clock.againstToDate}
        />
        {mode === "MONTHLY" ? (
          <Stat label={t.clock.monthRequired} value={formatMinutes(totals.requiredRangeMinutes)} />
        ) : (
          <Stat
            label={t.clock.flagged}
            value={String(totals.flaggedDays)}
            sub={t.clock.daysToCheck}
          />
        )}
        <Stat
          label={t.clock.excludedDays}
          value={String(totals.excludedDays)}
          sub={t.clock.ofDays(employedDays)}
        />
      </StatRow>

      {worked ? null : (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {t.clock.emptyMonth}
        </p>
      )}

      <div className="hidden grid-cols-7 gap-2 sm:grid">
        {weekdayHeadings(locale).map((heading) => (
          <div
            key={heading}
            className="text-center text-[11px] font-bold tracking-[0.06em] uppercase"
            style={{ color: "var(--text-faint)" }}
          >
            {heading}
          </div>
        ))}
        {Array.from({ length: leadingBlanks({ year: month.year, month: month.month }) }).map(
          (_, index) => (
            <div key={`blank-${index}`} aria-hidden />
          )
        )}
        {month.days.map((day) => (
          <MonthCell key={day.businessDate} day={day} mode={mode} today={today} />
        ))}
      </div>

      <p className="text-xs" style={{ color: "var(--text-faint)" }}>
        {t.clock.hatchedLegend}
      </p>

      <ul className="flex flex-col gap-2 sm:hidden">
        {month.days
          // A phone shows the days that happened: scrolling past an empty
          // future to reach today is the one thing the grid never asks of it.
          .filter((day) => !day.upcoming)
          .map((day) => (
            <li
              key={day.businessDate}
              data-testid={`month-row-${day.businessDate}`}
              className="flex items-start gap-3 rounded-xl border p-3"
              style={{
                borderColor: day.businessDate === today ? "var(--primary)" : "var(--border)",
                ...(isExcluded(day) ? excludedSurface : {}),
              }}
            >
              <span className="w-8 shrink-0 text-sm font-semibold tabular-nums">
                {dayNumber(day.businessDate)}
              </span>
              <div className="flex flex-1 flex-col gap-0.5">
                <DayFigures day={day} mode={mode} today={today} />
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}
