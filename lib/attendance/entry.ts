import { instantAt } from "@/lib/attendance/correction";
import { addDays } from "@/lib/attendance/month";
import type { KnownSpell } from "@/lib/attendance/team";
import { formatClockTime } from "@/lib/attendance/today";

/**
 * The "Add a session" form: a business date, a start and an end in the
 * organization's zone, and whether the end falls on the next day. A switch
 * rather than an end read as tomorrow whenever it is earlier than the start,
 * so a mistyped end reads as an error instead of as a night shift.
 *
 * The backend checks all of it again, and the rules only it can see (the
 * session ceiling, the Employment's spell) come back as refusals.
 */
export type EntryDraft = {
  businessDate: string;
  startedAt: string;
  endedAt: string;
  nextDay: boolean;
};

export type EntryError =
  | { kind: "REQUIRED" }
  | { kind: "OUTSIDE_WINDOW" }
  | { kind: "FUTURE_DATE" }
  | { kind: "BEFORE_EMPLOYMENT"; began: string }
  | { kind: "AFTER_EMPLOYMENT"; ended: string }
  | { kind: "END_BEFORE_START" }
  | { kind: "END_IN_FUTURE"; now: string }
  | { kind: "OVERLAPS"; from: string; to: string | null };

export type EntryErrors = {
  businessDate?: EntryError;
  startedAt?: EntryError;
  endedAt?: EntryError;
};

/** The draft's two instants, or null where a field is not a time yet. */
export function entrySpan(
  draft: EntryDraft,
  timezone: string | null
): { startedAt: string | null; endedAt: string | null } {
  if (draft.businessDate === "") return { startedAt: null, endedAt: null };
  return {
    startedAt: instantAt(draft.businessDate, draft.startedAt, timezone),
    endedAt: instantAt(
      draft.nextDay ? addDays(draft.businessDate, 1) : draft.businessDate,
      draft.endedAt,
      timezone
    ),
  };
}

export function entryErrors(
  draft: EntryDraft,
  context: {
    timezone: string | null;
    now: Date;
    /** Today in the organization's zone. */
    today: string;
    /** The earliest date the reader may enter; null without a limit. */
    earliest: string | null;
    /** The day's other sessions, to name the one an entry would run over. */
    sessions: { startedAt: string; endedAt: string | null }[];
    spell?: KnownSpell;
  }
): EntryErrors {
  const errors: EntryErrors = {};

  if (draft.businessDate === "") errors.businessDate = { kind: "REQUIRED" };
  else if (draft.businessDate > context.today) errors.businessDate = { kind: "FUTURE_DATE" };
  else if (context.earliest !== null && draft.businessDate < context.earliest) {
    errors.businessDate = { kind: "OUTSIDE_WINDOW" };
  } else if (context.spell?.began && draft.businessDate < context.spell.began) {
    errors.businessDate = { kind: "BEFORE_EMPLOYMENT", began: context.spell.began };
  } else if (context.spell?.ended && draft.businessDate > context.spell.ended) {
    errors.businessDate = { kind: "AFTER_EMPLOYMENT", ended: context.spell.ended };
  }

  const span = entrySpan(draft, context.timezone);
  if (span.startedAt === null) errors.startedAt = { kind: "REQUIRED" };
  if (span.endedAt === null) errors.endedAt = { kind: "REQUIRED" };
  if (span.startedAt === null || span.endedAt === null) return errors;

  const start = Date.parse(span.startedAt);
  const end = Date.parse(span.endedAt);

  if (end <= start) {
    errors.endedAt = { kind: "END_BEFORE_START" };
  } else if (end > context.now.getTime()) {
    errors.endedAt = {
      kind: "END_IN_FUTURE",
      now: formatClockTime(context.now.toISOString(), context.timezone),
    };
  }

  // Half-open, as the backend reads it: back to back is not an overlap.
  const over = context.sessions.find(
    (session) =>
      Date.parse(session.startedAt) < end &&
      (session.endedAt === null || Date.parse(session.endedAt) > start)
  );
  if (over && errors.endedAt?.kind !== "END_BEFORE_START") {
    errors.startedAt = {
      kind: "OVERLAPS",
      from: formatClockTime(over.startedAt, context.timezone),
      to: over.endedAt === null ? null : formatClockTime(over.endedAt, context.timezone),
    };
  }

  return errors;
}
