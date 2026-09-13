"use client";

import { CalendarOff, ClockAlert, Play } from "lucide-react";
import type { AttendanceBalanceMode, AttendanceDay } from "@/lib/api/attendance";
import { formatMinutes, formatSignedMinutes } from "@/lib/attendance/duration";
import { exclusionLabel } from "@/lib/attendance/exclusion";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * A day nobody owed, drawn as one. The hatching is the mockup's: it reads as
 * "nothing expected here" without spending a colour that means something else.
 */
export const excludedSurface = {
  background:
    "repeating-linear-gradient(-45deg, transparent 0 6px, color-mix(in oklch, var(--text) 4%, transparent) 6px 7px)",
} as const;

/**
 * True while the whole day is off — a half day is still a day at work.
 *
 * Optional, not because the field is: the repos deploy independently, and a
 * backend older than this build sends a day without one. A missing day off is
 * a wrong figure; reading `extent` off nothing is a blank screen.
 */
export const isExcluded = (day: AttendanceDay): boolean => day.exclusion?.extent === "FULL";

/** One figure above a week or a month, with the aside that explains it. */
export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-[11px] font-bold tracking-[0.06em] uppercase"
        style={{ color: "var(--text-faint)" }}
      >
        {label}
      </span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
      {sub ? (
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {sub}
        </span>
      ) : null}
    </div>
  );
}

export function StatRow({ children, columns = 4 }: { children: React.ReactNode; columns?: 4 | 5 }) {
  return (
    <div
      className={`grid grid-cols-2 gap-3 rounded-2xl border p-4 ${
        columns === 5 ? "sm:grid-cols-5" : "sm:grid-cols-4"
      }`}
      style={{ borderColor: "var(--border)" }}
    >
      {children}
    </div>
  );
}

/**
 * A day's balance, coloured. Shown only in `DAILY` mode: over a month the one
 * number on top is the only balance on the page, so a per-day chip would invite
 * a second reading of it.
 */
export function BalanceChip({ minutes }: { minutes: number }) {
  const over = minutes >= 0;
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
      style={{
        background: over ? "var(--ok-soft)" : "var(--danger-soft)",
        color: over ? "var(--ok)" : "var(--danger)",
      }}
    >
      {formatSignedMinutes(minutes)}
    </span>
  );
}

/**
 * A day's numbers, wherever the day is drawn: worked against required, what was
 * present, the balance where the mode shows one, and the flags. The week's
 * cards and the month's cells differ only in how large the worked figure is.
 */
export function DayFigures({
  day,
  mode,
  today,
  size = "md",
}: {
  day: AttendanceDay;
  mode: AttendanceBalanceMode;
  today: string | null;
  size?: "md" | "lg";
}) {
  const { t } = useTranslation();
  const exclusion = day.exclusion ?? null;
  const excluded = isExcluded(day);
  const required = formatMinutes(day.requiredMinutes);

  return (
    <>
      <div
        className={
          size === "lg"
            ? "text-xl font-semibold tabular-nums"
            : "text-base font-semibold tabular-nums"
        }
      >
        {/* A day off nobody worked has no figure to print, only a reason. */}
        {excluded && day.presenceMinutes === 0 ? "" : formatMinutes(day.workedMinutes)}
      </div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        {exclusion === null
          ? t.clock.ofRequired(required)
          : excluded
            ? exclusionLabel(t, exclusion)
            : t.clock.halfDayOf(required)}
      </div>
      {day.presenceMinutes > 0 ? (
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          {t.clock.present(formatMinutes(day.presenceMinutes))}
        </div>
      ) : null}
      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
        {mode === "DAILY" && day.balanceMinutes !== null ? (
          <BalanceChip minutes={day.balanceMinutes} />
        ) : null}
        <DayFlags day={day} today={today} />
        {exclusion !== null && !excluded ? (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ background: "var(--muted)", color: "var(--text-muted)" }}
          >
            {exclusionLabel(t, exclusion)}
          </span>
        ) : null}
      </div>
    </>
  );
}

/**
 * What asks to be looked at on a day: a session the sweep closed, one clocked
 * into a day nobody owed, and one still running on a day that has passed.
 * Today's open session is somebody at work, so it reads as a state rather than
 * a flag.
 */
export function DayFlags({ day, today }: { day: AttendanceDay; today: string | null }) {
  const { t } = useTranslation();

  return (
    <>
      {day.autoClosed ? (
        <span
          className="flex items-center gap-1 text-xs font-semibold [&_svg]:size-[14px]"
          style={{ color: "var(--warm)" }}
        >
          <ClockAlert />
          {t.clock.autoClosedFlag}
        </span>
      ) : null}
      {day.excludedClockIn ? (
        <span
          className="flex items-center gap-1 text-xs font-semibold [&_svg]:size-[14px]"
          style={{ color: "var(--warm)" }}
        >
          <CalendarOff />
          {t.clock.excludedClockInFlag}
        </span>
      ) : null}
      {day.open ? (
        <span
          className="flex items-center gap-1 text-xs font-semibold [&_svg]:size-[14px]"
          style={{
            color: day.businessDate === today ? "var(--ok)" : "var(--warm)",
          }}
        >
          <Play />
          {t.clock.stillOpenFlag}
        </span>
      ) : null}
    </>
  );
}
