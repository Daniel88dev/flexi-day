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

function toUtc(date: IsoDate): number {
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
