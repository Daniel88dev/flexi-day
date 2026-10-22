import { isoDate } from "@/lib/calendar/month-grid";

/** `month` is 1-12. */
export type YearMonth = { year: number; month: number };

/** Whole months from `first` through `last`, both included; `first` never comes after `last`. */
export type MonthRange = { first: YearMonth; last: YearMonth };

export function rangeLabel(range: MonthRange, monthsShort: readonly string[]): string {
  const { first, last } = range;
  const name = (m: YearMonth) => monthsShort[m.month - 1];
  if (first.year !== last.year) {
    return `${name(first)} ${first.year} – ${name(last)} ${last.year}`;
  }
  if (first.month === last.month) return `${name(first)} ${first.year}`;
  return `${name(first)} – ${name(last)} ${last.year}`;
}

const index = (m: YearMonth) => m.year * 12 + (m.month - 1);
const fromIndex = (i: number): YearMonth => ({ year: Math.floor(i / 12), month: (i % 12) + 1 });

/** The half-open `from`/`to` that `GET /api/vacation` takes for the range. */
export function rangeQuery(range: MonthRange): { from: string; to: string } {
  return {
    from: isoDate(range.first.year, range.first.month, 1),
    to: isoDate(range.last.year, range.last.month + 1, 1),
  };
}

export type MonthPreset = "this" | "next3" | "year";

export function presetRange(preset: MonthPreset, today: YearMonth): MonthRange {
  switch (preset) {
    case "this":
      return { first: today, last: today };
    case "next3":
      return { first: today, last: fromIndex(index(today) + 2) };
    case "year":
      return { first: { year: today.year, month: 1 }, last: { year: today.year, month: 12 } };
  }
}

export function withFirst(range: MonthRange, first: YearMonth): MonthRange {
  return { first, last: index(first) > index(range.last) ? first : range.last };
}

export function withLast(range: MonthRange, last: YearMonth): MonthRange {
  return { first: index(last) < index(range.first) ? last : range.first, last };
}

export function customMonths(today: YearMonth): YearMonth[] {
  const start = index({ year: today.year - 1, month: 1 });
  return Array.from({ length: 36 }, (_, i) => fromIndex(start + i));
}

export type MonthSelection = { preset: MonthPreset | "custom"; range: MonthRange };
