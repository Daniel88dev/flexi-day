export const EARLIEST_BIRTH_YEAR = 1900;

/** The soft pink every birthday wears, on the calendar and in settings. */
export const BIRTHDAY_TINT = "oklch(0.7 0.14 340)";

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

/** Days a birthday may fall on in `month` (1-12); 29 February counts. */
export function daysInMonth(month: number | null): number {
  if (month === null) return 31;
  return DAYS_IN_MONTH[month - 1] ?? 31;
}

/** Reads the optional year field: empty is a valid "no year". */
export function parseBirthYear(text: string, today: Date): { year: number | null; valid: boolean } {
  if (text === "") return { year: null, valid: true };
  const year = Number(text);
  const valid = /^\d{4}$/.test(text) && year >= EARLIEST_BIRTH_YEAR && year <= today.getFullYear();
  return { year: valid ? year : null, valid };
}

function isLeap(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** The age turned on the next birthday, today included, or null without a year. */
export function ageAtNextBirthday(
  birthday: { month: number; day: number; year: number | null },
  today: Date
): number | null {
  if (birthday.year === null) return null;
  const y = today.getFullYear();
  const dayIn = (year: number) =>
    birthday.month === 2 && birthday.day === 29 && !isLeap(year) ? 28 : birthday.day;
  const m = today.getMonth() + 1;
  const d = today.getDate();
  const stillAhead = birthday.month > m || (birthday.month === m && dayIn(y) >= d);
  return (stillAhead ? y : y + 1) - birthday.year;
}

/**
 * What the share switch offers. `open`: it turns on and off. `lapsed`: a stored share outlived
 * every paid group, so the switch stays only for turning it off. `notice`: no paid group and
 * nothing shared, so the notice replaces the switch.
 */
export type ShareSwitchState = "open" | "lapsed" | "notice";

export function shareSwitchState(input: {
  canShare: boolean;
  storedShared: boolean;
}): ShareSwitchState {
  if (input.canShare) return "open";
  return input.storedShared ? "lapsed" : "notice";
}

/** The first word of a person's name, or `fallback` when there is none. */
export function firstName(name: string | null | undefined, fallback = ""): string {
  return name?.trim().split(/\s+/)[0] || fallback;
}
