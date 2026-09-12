import type { AttendanceBreak, AttendanceSession } from "@/lib/api/attendance";

/**
 * Whole minutes between two instants, floored and never negative — a clock
 * that has been running for forty seconds reads 0:00, not 0:01.
 */
export function minutesBetween(from: string, to: string | number | Date): number {
  const start = new Date(from).getTime();
  const end = to instanceof Date ? to.getTime() : new Date(to).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, Math.floor((end - start) / 60_000));
}

/** How long an open span has been running, or how long a closed one lasted. */
export const spanMinutes = (
  span: { startedAt: string; endedAt: string | null },
  now: Date
): number => minutesBetween(span.startedAt, span.endedAt ?? now);

/** Clock-in to clock-out, breaks included — the `presence` of `docs/attendance.md`. */
export const presenceMinutes = (sessions: AttendanceSession[], now: Date): number =>
  sessions.reduce((total, session) => total + spanMinutes(session, now), 0);

export const breaksMinutes = (sessions: AttendanceSession[], now: Date): number =>
  sessions.reduce(
    (total, session) =>
      total + session.breaks.reduce((sum, entry) => sum + spanMinutes(entry, now), 0),
    0
  );

export type TimelineSegment = {
  kind: "work" | "break";
  startedAt: string;
  /** Null while the segment is still running. */
  endedAt: string | null;
  minutes: number;
};

/**
 * One session as the alternating work and break rows the day view shows. A
 * closed work stretch under a minute is dropped rather than rendered as a 0:00
 * row: clocking in and going straight on a break, or ending one and clocking
 * out, should not leave a line saying nothing happened.
 */
export function buildTimeline(session: AttendanceSession, now: Date): TimelineSegment[] {
  const breaks = [...session.breaks].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const segments: TimelineSegment[] = [];

  const pushWork = (from: string, to: string | null) => {
    const minutes = minutesBetween(from, to ?? now);
    if (to !== null && minutes === 0) return;
    segments.push({ kind: "work", startedAt: from, endedAt: to, minutes });
  };

  let cursor = session.startedAt;
  for (const entry of breaks) {
    pushWork(cursor, entry.startedAt);
    segments.push({
      kind: "break",
      startedAt: entry.startedAt,
      endedAt: entry.endedAt,
      minutes: spanMinutes(entry, now),
    });
    // An open break runs to the end of the session, so nothing follows it.
    if (entry.endedAt === null) return segments;
    cursor = entry.endedAt;
  }

  pushWork(cursor, session.endedAt);
  return segments;
}

/**
 * An instant as `HH:mm` in the organization's zone rather than the browser's:
 * an employee travelling still sees the times their employer records.
 */
export function formatClockTime(iso: string, timezone: string | null): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      ...(timezone ? { timeZone: timezone } : {}),
    }).format(date);
  } catch {
    // An unknown zone must not blank the whole widget.
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(date);
  }
}

/** What the big button does next, which is the only thing the widget branches on. */
export type ClockState = "inactive" | "out" | "in" | "break";

export function clockStateOf(state: {
  active: boolean;
  openSession: AttendanceSession | null;
  openBreak: AttendanceBreak | null;
}): ClockState {
  if (!state.active) return "inactive";
  if (!state.openSession) return "out";
  return state.openBreak ? "break" : "in";
}
