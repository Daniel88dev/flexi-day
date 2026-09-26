import { addDays } from "./month";

export const LINKED_DATE_PARAM = "date";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

// An impossible day such as 2026-02-30 either rolls over or throws on the way through.
function isCalendarDay(value: string): boolean {
  if (!ISO_DAY.test(value)) return false;
  try {
    return addDays(value, 0) === value;
  } catch {
    return false;
  }
}

/**
 * The day a `?date=` link opens the Day view on. Anything that is not a real,
 * already-begun business day opens today instead.
 */
export function linkedDay(param: string | null, today: string): string {
  if (param === null || !isCalendarDay(param) || param > today) return today;
  return param;
}
