import type { IsoDate } from "@/lib/api/types";
import { addDays } from "@/lib/attendance/month";
import { toUtc } from "@/lib/calendar/month-grid";

/** Inclusive. */
export type DateRange = { from: IsoDate; to: IsoDate };

export function normalizeRange(anchor: IsoDate, head: IsoDate): DateRange {
  return anchor <= head ? { from: anchor, to: head } : { from: head, to: anchor };
}

function* datesIn({ from, to }: DateRange): Generator<IsoDate> {
  for (let date = from; date <= to; date = addDays(date, 1)) yield date;
}

function isWeekend(date: IsoDate): boolean {
  const weekday = new Date(toUtc(date)).getUTCDay();
  return weekday === 0 || weekday === 6;
}

export function workingDayCount(range: DateRange, holidays: ReadonlySet<IsoDate>): number {
  let count = 0;
  for (const date of datesIn(range)) if (!isWeekend(date) && !holidays.has(date)) count++;
  return count;
}

export function bookedDayCount(range: DateRange, booked: ReadonlySet<IsoDate>): number {
  let count = 0;
  for (const date of datesIn(range)) if (booked.has(date)) count++;
  return count;
}

export const RANGE_FILL = "color-mix(in oklch, var(--primary) 17%, var(--surface))";
export const BOOKED_FILL = "color-mix(in oklch, var(--destructive) 20%, var(--surface))";

export function rangeCellFill(
  date: IsoDate,
  range: DateRange | null,
  booked: ReadonlySet<IsoDate>
): string | undefined {
  if (!range || date < range.from || date > range.to) return undefined;
  return booked.has(date) ? BOOKED_FILL : RANGE_FILL;
}

export function formatDragRange({ from, to }: DateRange, locale: string): string {
  const format = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const start = new Date(toUtc(from));
  return from === to ? format.format(start) : format.formatRange(start, new Date(toUtc(to)));
}

export function datesCovered(ranges: readonly DateRange[]): Set<IsoDate> {
  const dates = new Set<IsoDate>();
  for (const range of ranges) for (const date of datesIn(range)) dates.add(date);
  return dates;
}
