"use client";

import type { AttendanceSession } from "@/lib/api/attendance";
import { formatMinutes } from "@/lib/attendance/duration";
import { breaksMinutes, presenceMinutes } from "@/lib/attendance/today";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * The day so far, under both the clock and the timeline. Presence and breaks
 * only: worked and required time need the organization's break allowance and
 * required minutes, which are an org-admin read.
 */
export function DayTotals({ sessions, now }: { sessions: AttendanceSession[]; now: Date }) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-3 gap-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
      <Stat label={t.clock.presence} value={formatMinutes(presenceMinutes(sessions, now))} />
      <Stat label={t.clock.breaks} value={formatMinutes(breaksMinutes(sessions, now))} />
      <Stat label={t.clock.sessions} value={String(sessions.length)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-[11px] font-bold tracking-[0.06em] uppercase"
        style={{ color: "var(--text-faint)" }}
      >
        {label}
      </span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </div>
  );
}
