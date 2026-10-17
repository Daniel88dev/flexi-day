import type { BirthdayShareGroup } from "@/lib/api/birthday";

export const EARLIEST_BIRTH_YEAR = 1900;

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
 * What the share switch offers (D28). `open`: it turns on and off. `lapsed`: only turning off
 * works, because no group is on a paid plan any more. `notice`: there is nowhere to share.
 */
export type ShareSwitchState = "open" | "lapsed" | "notice";

export function shareSwitchState(input: {
  canShare: boolean;
  storedShared: boolean;
  shareGroups: BirthdayShareGroup[];
}): ShareSwitchState {
  if (input.canShare) return "open";
  if (input.storedShared || input.shareGroups.length > 0) return "lapsed";
  return "notice";
}
