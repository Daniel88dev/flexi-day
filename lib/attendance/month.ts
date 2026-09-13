import type { AttendanceDay } from "@/lib/api/attendance";

/** A calendar month, the unit the attendance read is fetched by. */
export type YearMonth = { year: number; month: number };

/** Business dates are plain days, so they are read at UTC noon and never shift. */
const dateOf = (iso: string): Date => new Date(`${iso}T12:00:00Z`);

const isoOf = (date: Date): string => date.toISOString().slice(0, 10);

export function addDays(iso: string, days: number): string {
  const date = dateOf(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return isoOf(date);
}

export function yearMonthOf(iso: string): YearMonth {
  const date = dateOf(iso);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export function addMonths({ year, month }: YearMonth, delta: number): YearMonth {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

const sameYearMonth = (a: YearMonth, b: YearMonth) => a.year === b.year && a.month === b.month;

/** The Monday of the week a date falls in. The product's weeks start on Monday. */
export function startOfWeek(iso: string): string {
  const weekday = dateOf(iso).getUTCDay();
  return addDays(iso, weekday === 0 ? -6 : 1 - weekday);
}

export function weekDates(mondayIso: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(mondayIso, index));
}

/**
 * The one or two months a week's days fall in. A week that straddles a month
 * boundary is fetched as two months rather than as a range of its own, because
 * the month is what the endpoint answers and what the totals are computed over.
 */
export function monthsOfWeek(mondayIso: string): YearMonth[] {
  const first = yearMonthOf(mondayIso);
  const last = yearMonthOf(addDays(mondayIso, 6));
  return sameYearMonth(first, last) ? [first] : [first, last];
}

/**
 * Blank cells before the 1st in a Monday-first grid — Sunday the 1st needs six
 * of them, not none.
 */
export function leadingBlanks({ year, month }: YearMonth): number {
  const weekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return weekday === 0 ? 6 : weekday - 1;
}

/**
 * A week's own figures, read the way the month's totals are: required counts
 * only the days already begun, so the rest of the week is not a shortfall.
 */
export function weekTotals(days: AttendanceDay[]) {
  const begun = days.filter((day) => !day.upcoming);
  const workedMinutes = begun.reduce((total, day) => total + day.workedMinutes, 0);
  const requiredMinutes = begun.reduce((total, day) => total + day.requiredMinutes, 0);

  return {
    workedMinutes,
    requiredMinutes,
    balanceMinutes: workedMinutes - requiredMinutes,
    flaggedDays: days.filter((day) => day.flagged).length,
  };
}

/** The days of `dates`, in that order, from whatever months have arrived. */
export function pickDays(months: { days: AttendanceDay[] }[], dates: string[]): AttendanceDay[] {
  const byDate = new Map(
    months.flatMap((month) => month.days).map((day) => [day.businessDate, day])
  );
  return dates.flatMap((date) => {
    const day = byDate.get(date);
    return day ? [day] : [];
  });
}
