import {
  CalendarRecordType,
  isKnownCalendarRecordType,
  vacationStatus,
  type IsoDate,
  type UserSummary,
  type VacationListItem,
} from "@/lib/api/types";
import { addDays } from "@/lib/attendance/month";
import { weekSpan, type GridWeek } from "@/lib/calendar/month-grid";

export const MAX_STRIPES = 3;

export type DayRecord = {
  id: string;
  userId: string;
  user?: UserSummary;
  type: CalendarRecordType;
  date: IsoDate;
  halfDay: boolean;
  pending: boolean;
  mirroredFrom: string | null;
};

/** Consecutive days of one person, type and status. */
export type StripeBooking = {
  id: string;
  userId: string;
  type: CalendarRecordType;
  from: IsoDate;
  to: IsoDate;
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

export function toDayRecords(vacations: readonly VacationListItem[]): DayRecord[] {
  return vacations
    .filter((v) => vacationStatus(v) !== "rejected")
    .filter((v) => isKnownCalendarRecordType(v.vacationType))
    .map((v) => ({
      id: v.id,
      userId: v.userId,
      user: v.user,
      type: v.vacationType,
      date: v.requestedDay,
      halfDay: v.halfDay,
      pending: vacationStatus(v) === "pending",
      mirroredFrom: v.mirroredFromGroupName ?? null,
    }));
}

export function stripeBookings(records: readonly DayRecord[]): StripeBooking[] {
  const key = (r: DayRecord) => `${r.userId}|${r.type}|${r.pending}|${r.mirroredFrom ?? ""}`;
  const sorted = [...records].sort(
    (a, b) => key(a).localeCompare(key(b)) || a.date.localeCompare(b.date)
  );
  const bookings: StripeBooking[] = [];
  let current: StripeBooking | null = null;
  let currentKey: string | null = null;
  for (const r of sorted) {
    if (current && key(r) === currentKey && r.date === addDays(current.to, 1)) {
      current.to = r.date;
      continue;
    }
    current = {
      id: r.id,
      userId: r.userId,
      type: r.type,
      from: r.date,
      to: r.date,
      pending: r.pending,
    };
    currentKey = key(r);
    bookings.push(current);
  }
  return bookings.sort((a, b) => a.from.localeCompare(b.from));
}

/**
 * Packs a week's bookings into at most MAX_STRIPES lanes, the viewer's own first, then by start
 * day, longest first. `more` counts, per column, the bookings that found no lane. Bank holidays
 * never take a stripe; they tint their cells instead.
 */
export function placeStripeWeek(
  week: GridWeek,
  bookings: readonly StripeBooking[],
  viewerId: string | null
): { stripes: PlacedStripe[]; more: Map<number, number> } {
  const more = new Map<number, number>();
  const isViewer = (p: PlacedStripe) => Number(p.booking.userId === viewerId);
  const candidates: PlacedStripe[] = bookings
    .filter((b) => b.type !== CalendarRecordType.BankHoliday)
    .flatMap((b) => {
      const span = weekSpan(week, b.from, b.to);
      return span ? [{ booking: b, ...span, lane: -1 }] : [];
    })
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

/** Everyone away on `date`, the viewer first, then by name. */
export function dayEntries(
  records: readonly DayRecord[],
  date: IsoDate,
  viewerId: string | null
): DayRecord[] {
  const rank = (r: DayRecord) => (r.userId === viewerId ? 0 : 1);
  return records
    .filter((r) => r.date === date)
    .sort((a, b) => rank(a) - rank(b) || (a.user?.name ?? "").localeCompare(b.user?.name ?? ""));
}
