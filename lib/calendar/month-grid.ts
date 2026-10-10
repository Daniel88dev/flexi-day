import type { IsoDate } from "@/lib/api/types";
import { addDays } from "@/lib/attendance/month";

/** One cell of the month grid. Padding cells outside the month still carry their real date. */
export type GridDay = {
  date: IsoDate;
  day: number;
  inMonth: boolean;
};

/** Seven days, Monday first. */
export type GridWeek = GridDay[];

export function toUtc(date: IsoDate): number {
  return Date.UTC(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10))
  );
}

function fromUtc(ms: number): IsoDate {
  return new Date(ms).toISOString().slice(0, 10);
}

export function isoDate(year: number, month: number, day: number): IsoDate {
  return fromUtc(Date.UTC(year, month - 1, day));
}

function mondayIndex(date: IsoDate): number {
  return (new Date(toUtc(date)).getUTCDay() + 6) % 7;
}

/** Whole Monday-first weeks covering `first` through `last`. */
export function weeksCovering(first: IsoDate, last: IsoDate): IsoDate[][] {
  const start = addDays(first, -mondayIndex(first));
  const end = addDays(last, 6 - mondayIndex(last));
  const weeks: IsoDate[][] = [];
  for (let monday = start; monday <= end; monday = addDays(monday, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, col) => addDays(monday, col)));
  }
  return weeks;
}

/** 1-12 `month`. */
export function monthWeeks(year: number, month: number): GridWeek[] {
  const first = isoDate(year, month, 1);
  const last = isoDate(year, month + 1, 0);
  return weeksCovering(first, last).map((week) =>
    week.map((date) => ({
      date,
      day: Number(date.slice(8, 10)),
      inMonth: date >= first && date <= last,
    }))
  );
}

export type WeekSpan = {
  /** Zero-based column the range starts in. */
  startCol: number;
  /** Exclusive. */
  endCol: number;
  continuesLeft: boolean;
  continuesRight: boolean;
};

/** Where the inclusive range `from`..`to` falls in `week`, or null when it misses it. */
export function weekSpan(week: GridWeek, from: IsoDate, to: IsoDate): WeekSpan | null {
  const weekStart = week[0].date;
  const weekEnd = week[week.length - 1].date;
  if (from > weekEnd || to < weekStart) return null;
  const start = from > weekStart ? from : weekStart;
  const end = to < weekEnd ? to : weekEnd;
  return {
    startCol: week.findIndex((d) => d.date === start),
    endCol: week.findIndex((d) => d.date === end) + 1,
    continuesLeft: from < weekStart,
    continuesRight: to > weekEnd,
  };
}

/** The first and last date `monthWeeks` shows, padding included. */
export function gridRange(year: number, month: number): { from: IsoDate; to: IsoDate } {
  const weeks = weeksCovering(isoDate(year, month, 1), isoDate(year, month + 1, 0));
  return { from: weeks[0][0], to: weeks[weeks.length - 1][6] };
}

export function gridYears(year: number, month: number): number[] {
  const { from, to } = gridRange(year, month);
  return Array.from(new Set([Number(from.slice(0, 4)), Number(to.slice(0, 4))]));
}

export function seamColumn(week: GridWeek): number | null {
  const col = week.findIndex((d) => d.day === 1);
  return col > 0 ? col : null;
}

/** The first adjacent-month cell on each side: the grid's first cell and the next month's 1st. */
export function monthLabelDates(weeks: GridWeek[]): Set<IsoDate> {
  const labelled = new Set<IsoDate>();
  const first = weeks[0][0];
  if (!first.inMonth) labelled.add(first.date);
  const nextFirst = weeks[weeks.length - 1].find((d) => !d.inMonth && d.day === 1);
  if (nextFirst) labelled.add(nextFirst.date);
  return labelled;
}

export function formatIsoDate(
  date: IsoDate,
  locale: string,
  options: Intl.DateTimeFormatOptions
): string {
  return new Date(toUtc(date)).toLocaleDateString(locale, { ...options, timeZone: "UTC" });
}
