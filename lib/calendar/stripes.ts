import {
  CalendarRecordType,
  isKnownCalendarRecordType,
  vacationStatus,
  type UserSummary,
  type VacationListItem,
} from "@/lib/api/types";

export const MAX_STRIPES = 3;

/** Seven day-of-month cells, Monday first; `null` pads the days outside the month. */
export type Week = Array<number | null>;

export type DayRecord = {
  id: string;
  userId: string;
  user?: UserSummary;
  type: CalendarRecordType;
  day: number;
  halfDay: boolean;
  pending: boolean;
  mirroredFrom: string | null;
};

/** Consecutive days of one person, type and status. */
export type StripeBooking = {
  id: string;
  userId: string;
  type: CalendarRecordType;
  from: number;
  to: number;
  pending: boolean;
};

export type PlacedStripe = {
  booking: StripeBooking;
  /** Zero-based column the stripe starts in. */
  startCol: number;
  /** Exclusive. */
  endCol: number;
  continuesLeft: boolean;
  continuesRight: boolean;
  lane: number;
};

export function monthWeeks(year: number, month: number): Week[] {
  const days = new Date(year, month, 0).getDate();
  const offset = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const cells: Week = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  const weeks: Week[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function toDayRecords(vacations: readonly VacationListItem[]): DayRecord[] {
  return vacations
    .filter((v) => vacationStatus(v) !== "rejected")
    .filter((v) => isKnownCalendarRecordType(v.vacationType))
    .map((v) => ({
      id: v.id,
      userId: v.userId,
      user: v.user,
      type: v.vacationType,
      day: Number(v.requestedDay.slice(8, 10)),
      halfDay: v.halfDay,
      pending: vacationStatus(v) === "pending",
      mirroredFrom: v.mirroredFromGroupName ?? null,
    }));
}

export function stripeBookings(records: readonly DayRecord[]): StripeBooking[] {
  const key = (r: DayRecord) => `${r.userId}|${r.type}|${r.pending}|${r.mirroredFrom ?? ""}`;
  const sorted = [...records].sort((a, b) => key(a).localeCompare(key(b)) || a.day - b.day);
  const bookings: StripeBooking[] = [];
  let current: StripeBooking | null = null;
  let currentKey: string | null = null;
  for (const r of sorted) {
    if (current && key(r) === currentKey && r.day === current.to + 1) {
      current.to = r.day;
      continue;
    }
    current = {
      id: r.id,
      userId: r.userId,
      type: r.type,
      from: r.day,
      to: r.day,
      pending: r.pending,
    };
    currentKey = key(r);
    bookings.push(current);
  }
  return bookings.sort((a, b) => a.from - b.from);
}

/**
 * Packs a week's bookings into at most MAX_STRIPES lanes, the viewer's own first, then by start
 * day, longest first. `more` counts, per column, the bookings that found no lane. Bank holidays
 * never take a stripe; they tint their cells instead.
 */
export function placeStripeWeek(
  week: Week,
  bookings: readonly StripeBooking[],
  viewerId: string | null
): { stripes: PlacedStripe[]; more: Map<number, number> } {
  const days = week.filter((d): d is number => d !== null);
  const more = new Map<number, number>();
  if (days.length === 0) return { stripes: [], more };
  const start = days[0];
  const end = days[days.length - 1];

  const isViewer = (p: PlacedStripe) => Number(p.booking.userId === viewerId);
  const candidates: PlacedStripe[] = bookings
    .filter((b) => b.type !== CalendarRecordType.BankHoliday && b.from <= end && b.to >= start)
    .map((b) => ({
      booking: b,
      startCol: week.indexOf(Math.max(b.from, start)),
      endCol: week.indexOf(Math.min(b.to, end)) + 1,
      continuesLeft: b.from < start,
      continuesRight: b.to > end,
      lane: -1,
    }))
    .sort(
      (a, b) =>
        isViewer(b) - isViewer(a) ||
        a.startCol - b.startCol ||
        b.endCol - b.startCol - (a.endCol - a.startCol)
    );

  const lanes: PlacedStripe[][] = [];
  for (const p of candidates) {
    const free = lanes.findIndex((lane) =>
      lane.every((q) => p.startCol >= q.endCol || p.endCol <= q.startCol)
    );
    p.lane = free >= 0 ? free : lanes.length;
    if (free >= 0) lanes[free].push(p);
    else lanes.push([p]);
  }

  for (const p of candidates) {
    if (p.lane < MAX_STRIPES) continue;
    for (let col = p.startCol; col < p.endCol; col++) more.set(col, (more.get(col) ?? 0) + 1);
  }
  return { stripes: candidates.filter((p) => p.lane < MAX_STRIPES), more };
}

/** Everyone away on `day`, the viewer first, then by name. */
export function dayEntries(
  records: readonly DayRecord[],
  day: number,
  viewerId: string | null
): DayRecord[] {
  const rank = (r: DayRecord) => (r.userId === viewerId ? 0 : 1);
  return records
    .filter((r) => r.day === day)
    .sort((a, b) => rank(a) - rank(b) || (a.user?.name ?? "").localeCompare(b.user?.name ?? ""));
}
