"use client";

import { ClockAlert, Play } from "lucide-react";
import type { AttendanceBalanceMode, AttendanceDay } from "@/lib/api/attendance";
import { formatMinutes, formatSignedMinutes } from "@/lib/attendance/duration";
import { useTranslation } from "@/lib/i18n/use-translation";

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

export function StatRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 rounded-2xl border p-4 sm:grid-cols-4"
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

  return (
    <>
      <div
        className={
          size === "lg"
            ? "text-xl font-semibold tabular-nums"
            : "text-base font-semibold tabular-nums"
        }
      >
        {formatMinutes(day.workedMinutes)}
      </div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        {t.clock.ofRequired(formatMinutes(day.requiredMinutes))}
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
      </div>
    </>
  );
}

/**
 * What asks to be looked at on a day: a session the sweep closed, and one still
 * running on a day that has passed. Today's open session is somebody at work,
 * so it reads as a state rather than a flag.
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
