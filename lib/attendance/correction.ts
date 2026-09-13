import type { AttendanceBreak, AttendanceSession } from "@/lib/api/attendance";
import { addDays } from "@/lib/attendance/month";
import { formatClockTime } from "@/lib/attendance/today";

/**
 * The correction dialog edits `HH:mm` in the organization's zone, because that
 * is what the day was worked and recorded in. Everything here is the two
 * conversions that sit between those fields and the instants the API takes,
 * plus the rules the fields have to satisfy before Save is worth pressing.
 *
 * The backend enforces all of it again. Duplicated on purpose: an error the
 * person can see before they press the button is worth more than a 422.
 */

const HH_MM = /^\d{2}:\d{2}$/;

/** One editable break: the id it will be patched by, and its two fields. */
export type BreakDraft = { id: string; startedAt: string; endedAt: string };

export type SessionDraft = {
  startedAt: string;
  /** Empty means the session is still running. */
  endedAt: string;
  breaks: BreakDraft[];
};

/** Why a field cannot be saved. The dialog turns these into its own wording. */
export type CorrectionError = "REQUIRED" | "END_BEFORE_START" | "BREAK_OUTSIDE_SESSION";

export type CorrectionErrors = {
  startedAt?: CorrectionError;
  endedAt?: CorrectionError;
  breaks?: Record<string, CorrectionError>;
};

/** A patch of the shape both correction endpoints take. */
export type CorrectionPatch = { startedAt?: string; endedAt?: string | null };

export const timeFieldOf = (iso: string | null, timezone: string | null): string =>
  iso === null ? "" : formatClockTime(iso, timezone);

/**
 * How far the zone runs ahead of UTC at a given instant. Read off `Intl`
 * rather than a table, so it follows daylight saving without one.
 */
const zoneOffsetMs = (instant: Date, timezone: string): number => {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(instant);

    const part = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((candidate) => candidate.type === type)?.value ?? "0");

    const asUtc = Date.UTC(
      part("year"),
      part("month") - 1,
      part("day"),
      part("hour"),
      part("minute"),
      part("second")
    );
    return asUtc - instant.getTime();
  } catch {
    // An unknown zone must not send a wrong instant; UTC is at least honest.
    return 0;
  }
};

/**
 * `HH:mm` on a calendar day in the organization's zone, as the instant the API
 * stores. Two passes: the offset is itself a function of the instant, and the
 * first guess is what tells us which side of a daylight-saving change we are on.
 */
export const instantAt = (date: string, time: string, timezone: string | null): string | null => {
  if (!HH_MM.test(time)) return null;

  const naive = Date.parse(`${date}T${time}:00Z`);
  if (Number.isNaN(naive)) return null;
  if (!timezone) return new Date(naive).toISOString();

  const first = new Date(naive - zoneOffsetMs(new Date(naive), timezone));
  return new Date(naive - zoneOffsetMs(first, timezone)).toISOString();
};

export const sessionDraft = (
  session: AttendanceSession,
  timezone: string | null
): SessionDraft => ({
  startedAt: timeFieldOf(session.startedAt, timezone),
  endedAt: timeFieldOf(session.endedAt, timezone),
  breaks: session.breaks.map((entry) => ({
    id: entry.id,
    startedAt: timeFieldOf(entry.startedAt, timezone),
    endedAt: timeFieldOf(entry.endedAt, timezone),
  })),
});

type Resolved = {
  startedAt: string | null;
  endedAt: string | null;
  breaks: { id: string; startedAt: string | null; endedAt: string | null }[];
};

const isBefore = (a: string | null, b: string | null) => a !== null && b !== null && a < b;

/**
 * The draft's fields as instants.
 *
 * A clock-out *earlier* in the day than its clock-in is read as the next
 * morning — which is the case the sweep creates and an admin comes to fix: a
 * session closed at 00:05 belongs to the day it started, and typing 17:10 on it
 * has to mean that same day rather than the one after. Equal times are left
 * alone, so "ends when it starts" can still be refused rather than silently
 * becoming a twenty-four-hour day.
 *
 * A break follows the same reading only while the session itself crosses
 * midnight; inside an ordinary day, a break that ends before it starts is a
 * mistake rather than a night shift.
 */
const resolve = (draft: SessionDraft, businessDate: string, timezone: string | null): Resolved => {
  const startedAt = instantAt(businessDate, draft.startedAt, timezone);

  const sameDayEnd = instantAt(businessDate, draft.endedAt, timezone);
  const endedAt = isBefore(sameDayEnd, startedAt)
    ? instantAt(addDays(businessDate, 1), draft.endedAt, timezone)
    : sameDayEnd;

  const overnight = endedAt !== null && startedAt !== null && endedAt.slice(0, 10) > businessDate;
  const dayOf = (time: string, after: string | null) => {
    const sameDay = instantAt(businessDate, time, timezone);
    if (!overnight || !isBefore(sameDay, after)) return sameDay;
    return instantAt(addDays(businessDate, 1), time, timezone);
  };

  return {
    startedAt,
    endedAt,
    breaks: draft.breaks.map((entry) => {
      const breakStart = dayOf(entry.startedAt, startedAt);
      return { id: entry.id, startedAt: breakStart, endedAt: dayOf(entry.endedAt, breakStart) };
    }),
  };
};

/**
 * What is wrong with the draft, by field. The same three rules the backend
 * holds: an end after its start, and every break inside its session.
 */
export const correctionErrors = (
  draft: SessionDraft,
  businessDate: string,
  timezone: string | null
): CorrectionErrors => {
  const resolved = resolve(draft, businessDate, timezone);
  const errors: CorrectionErrors = {};

  if (resolved.startedAt === null) errors.startedAt = "REQUIRED";
  if (draft.endedAt !== "" && resolved.endedAt === null) errors.endedAt = "REQUIRED";
  if (
    resolved.startedAt !== null &&
    resolved.endedAt !== null &&
    resolved.endedAt <= resolved.startedAt
  ) {
    errors.endedAt = "END_BEFORE_START";
  }

  const breaks: Record<string, CorrectionError> = {};
  for (const entry of resolved.breaks) {
    if (entry.startedAt === null || entry.endedAt === null) {
      breaks[entry.id] = "REQUIRED";
      continue;
    }
    if (entry.endedAt <= entry.startedAt) {
      breaks[entry.id] = "END_BEFORE_START";
      continue;
    }
    const outside =
      isBefore(entry.startedAt, resolved.startedAt) ||
      (resolved.endedAt !== null &&
        (entry.endedAt > resolved.endedAt || entry.startedAt >= resolved.endedAt));
    if (outside) breaks[entry.id] = "BREAK_OUTSIDE_SESSION";
  }

  if (Object.keys(breaks).length > 0) errors.breaks = breaks;
  return errors;
};

const changed = (next: string | null, current: string | null): boolean =>
  next === null ? current !== null : current === null || next !== new Date(current).toISOString();

/**
 * What actually has to be sent for the session, or null when nothing moved.
 * Only the ends that changed travel, so an untouched clock-out is not
 * rewritten — and rewriting one is not free, since it records who closed it.
 */
export const toPatch = (
  session: AttendanceSession,
  draft: SessionDraft,
  timezone: string | null
): CorrectionPatch | null => {
  const resolved = resolve(draft, session.businessDate, timezone);
  const patch: CorrectionPatch = {};

  if (resolved.startedAt !== null && changed(resolved.startedAt, session.startedAt)) {
    patch.startedAt = resolved.startedAt;
  }
  if (changed(resolved.endedAt, session.endedAt)) patch.endedAt = resolved.endedAt;

  return Object.keys(patch).length === 0 ? null : patch;
};

/** {@link toPatch} for one break of the session the draft belongs to. */
export const toBreakPatch = (
  entry: AttendanceBreak,
  draft: SessionDraft,
  businessDate: string,
  timezone: string | null
): CorrectionPatch | null => {
  const resolved = resolve(draft, businessDate, timezone).breaks.find(
    (candidate) => candidate.id === entry.id
  );
  if (!resolved) return null;

  const patch: CorrectionPatch = {};
  if (resolved.startedAt !== null && changed(resolved.startedAt, entry.startedAt)) {
    patch.startedAt = resolved.startedAt;
  }
  if (changed(resolved.endedAt, entry.endedAt)) patch.endedAt = resolved.endedAt;

  return Object.keys(patch).length === 0 ? null : patch;
};
