import { addDays } from "./month";

/** The organization's self-service window: off, `days` back, or no limit (`days: null`). */
export type SelfServiceWindow = { enabled: boolean; days: number | null };

/**
 * Whether the person may change a day of their own. Mirrors the backend's
 * refusal reasons, so the screen hides what the API would refuse and names the
 * same cause.
 */
export type SelfServiceVerdict = "OPEN" | "OFF" | "OUTSIDE" | "ENDED";

export const MAX_DAY_LIMIT = 366;

/** How the window reads to a person, which is what every line describing it switches on. */
export type SelfServiceMode = "OFF" | "NO_LIMIT" | "TODAY" | "DAYS";

export function selfServiceMode(window: SelfServiceWindow): SelfServiceMode {
  if (!window.enabled) return "OFF";
  if (window.days === null) return "NO_LIMIT";
  return window.days === 0 ? "TODAY" : "DAYS";
}

/** The settings form's view of the window: the number stays text until it is saved. */
export type SelfServiceDraft = { enabled: boolean; noLimit: boolean; days: string };

/** What the draft saves as, or undefined while the number is not one the API takes. */
export function selfServiceDaysOf(draft: SelfServiceDraft): number | null | undefined {
  return draft.noLimit ? null : parseDayLimit(draft.days);
}

export function selfServiceVerdict({
  window,
  businessDate,
  today,
  open,
  employmentEnded,
}: {
  window: SelfServiceWindow;
  businessDate: string;
  today: string;
  /** The day holds a session that is still running. */
  open: boolean;
  employmentEnded: boolean;
}): SelfServiceVerdict {
  if (employmentEnded) return "ENDED";
  if (!window.enabled) return "OFF";
  if (open) return "OPEN";
  if (businessDate > today) return "OUTSIDE";
  const start = windowStart(today, window.days);
  return start === null || businessDate >= start ? "OPEN" : "OUTSIDE";
}

/** Whether the reader's own day offers "Add session": the one rule every screen asks. */
export function entryOffered({
  window,
  today,
  active,
  employmentEnded,
  day,
}: {
  window: SelfServiceWindow;
  today: string;
  active: boolean;
  employmentEnded: boolean;
  day: { businessDate: string; upcoming: boolean; exclusion: { cause: string } | null };
}): boolean {
  if (!active || day.upcoming || day.exclusion?.cause === "NOT_EMPLOYED") return false;
  return (
    selfServiceVerdict({
      window,
      businessDate: day.businessDate,
      today,
      open: false,
      employmentEnded,
    }) === "OPEN"
  );
}

/** The earliest date inside the window, or null when it has no limit. */
export function windowStart(today: string, days: number | null): string | null {
  return days === null ? null : addDays(today, -days);
}

/** The last day on which the window still reaches `businessDate`, or null with no limit. */
export function correctableUntil(businessDate: string, days: number | null): string | null {
  return days === null ? null : addDays(businessDate, days);
}

/** A typed day limit, or undefined unless it is a whole number from 0 to 366. */
export function parseDayLimit(text: string): number | undefined {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return undefined;
  const days = Number(trimmed);
  return days <= MAX_DAY_LIMIT ? days : undefined;
}

/** The calendar date an instant falls on in an IANA zone, as `YYYY-MM-DD`. */
export function businessDateIn(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const part = (type: "year" | "month" | "day") =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
