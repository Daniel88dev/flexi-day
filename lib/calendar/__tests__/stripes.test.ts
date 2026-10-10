import { describe, expect, it } from "vitest";
import { CalendarRecordType, type VacationListItem } from "@/lib/api/types";
import {
  MAX_STRIPES,
  dayEntries,
  placeStripeWeek,
  stripeBookings,
  toDayRecords,
  type DayRecord,
  type StripeBooking,
} from "../stripes";
import { isoDate, monthWeeks } from "../month-grid";

const VIEWER = "viewer";

function booking(
  id: string,
  from: number,
  to: number,
  extra: Partial<StripeBooking> = {}
): StripeBooking {
  return {
    id,
    userId: `u-${id}`,
    type: CalendarRecordType.Vacation,
    from: isoDate(2026, 9, from),
    to: isoDate(2026, 9, to),
    pending: false,
    ...extra,
  };
}

function record(day: number, extra: Partial<DayRecord> = {}): DayRecord {
  return {
    id: `v-${extra.userId ?? "u1"}-${day}`,
    userId: "u1",
    type: CalendarRecordType.Vacation,
    date: isoDate(2026, 9, day),
    halfDay: false,
    pending: false,
    mirroredFrom: null,
    ...extra,
  };
}

// September 2026 starts on a Tuesday: the first week runs Monday 31 August to Sunday 6 September.
const [SEP_WEEK_1, SEP_WEEK_2] = monthWeeks(2026, 9);

describe("placeStripeWeek", () => {
  it("returns a stripe spanning the booking's columns within the week", () => {
    const { stripes } = placeStripeWeek(SEP_WEEK_2, [booking("a", 8, 10)], VIEWER);

    expect(stripes).toHaveLength(1);
    expect(stripes[0]).toMatchObject({
      startCol: 1,
      endCol: 4,
      lane: 0,
      continuesLeft: false,
      continuesRight: false,
    });
  });

  it("marks a booking that runs into the previous and next week as continuing", () => {
    const { stripes } = placeStripeWeek(SEP_WEEK_2, [booking("a", 3, 16)], VIEWER);

    expect(stripes[0]).toMatchObject({
      startCol: 0,
      endCol: 7,
      continuesLeft: true,
      continuesRight: true,
    });
  });

  it("packs the viewer's bookings before everyone else's", () => {
    const others = [booking("a", 7, 13), booking("b", 7, 13), booking("c", 7, 13)];
    const mine = booking("mine", 12, 12, { userId: VIEWER });

    const { stripes } = placeStripeWeek(SEP_WEEK_2, [...others, mine], VIEWER);

    expect(stripes.find((s) => s.booking.id === "mine")?.lane).toBe(0);
  });

  it("orders the rest by start day, longest first", () => {
    const { stripes } = placeStripeWeek(
      SEP_WEEK_2,
      [booking("late", 10, 10), booking("short", 7, 7), booking("long", 7, 9)],
      VIEWER
    );

    const lane = (id: string) => stripes.find((s) => s.booking.id === id)?.lane;
    expect(lane("long")).toBe(0);
    expect(lane("short")).toBe(1);
    expect(lane("late")).toBe(0);
  });

  it(`caps a week at ${MAX_STRIPES} stripes and counts the rest per day`, () => {
    const bookings = [
      booking("a", 7, 13),
      booking("b", 7, 13),
      booking("c", 7, 13),
      booking("d", 8, 9),
      booking("e", 9, 9),
    ];

    const { stripes, more } = placeStripeWeek(SEP_WEEK_2, bookings, VIEWER);

    expect(stripes.map((s) => s.booking.id)).toEqual(["a", "b", "c"]);
    expect(more.get(0)).toBeUndefined();
    expect(more.get(1)).toBe(1);
    expect(more.get(2)).toBe(2);
    expect(more.get(3)).toBeUndefined();
  });

  it("leaves out bookings outside the week", () => {
    const { stripes, more } = placeStripeWeek(SEP_WEEK_1, [booking("a", 8, 10)], VIEWER);

    expect(stripes).toEqual([]);
    expect(more.size).toBe(0);
  });

  it("never gives a bank holiday a stripe", () => {
    const { stripes, more } = placeStripeWeek(
      SEP_WEEK_2,
      [booking("bh", 9, 9, { type: CalendarRecordType.BankHoliday })],
      VIEWER
    );

    expect(stripes).toEqual([]);
    expect(more.size).toBe(0);
  });
});

describe("stripeBookings", () => {
  it("joins consecutive days of one person and type into one booking", () => {
    const bookings = stripeBookings([record(9), record(7), record(8), record(11)]);

    expect(bookings.map((b) => [b.from, b.to])).toEqual([
      [isoDate(2026, 9, 7), isoDate(2026, 9, 9)],
      [isoDate(2026, 9, 11), isoDate(2026, 9, 11)],
    ]);
  });

  it("keeps pending and approved days apart", () => {
    const bookings = stripeBookings([record(7), record(8, { pending: true })]);

    expect(bookings.map((b) => [b.from, b.to, b.pending])).toEqual([
      [isoDate(2026, 9, 7), isoDate(2026, 9, 7), false],
      [isoDate(2026, 9, 8), isoDate(2026, 9, 8), true],
    ]);
  });

  it("joins consecutive days across a month boundary by their dates", () => {
    const bookings = stripeBookings([
      record(30),
      { ...record(30), id: "v-oct-1", date: "2026-10-01" },
    ]);

    expect(bookings.map((b) => [b.from, b.to])).toEqual([[isoDate(2026, 9, 30), "2026-10-01"]]);
  });

  it("keeps different people and types apart", () => {
    const bookings = stripeBookings([
      record(7),
      record(8, { userId: "u2" }),
      record(8, { type: CalendarRecordType.HomeOffice }),
    ]);

    expect(bookings).toHaveLength(3);
  });
});

describe("dayEntries", () => {
  const people = {
    viewer: { id: VIEWER, name: "Zoe Viewer", initials: "ZV", avatarColor: "red" },
    anna: { id: "anna", name: "Anna Adams", initials: "AA", avatarColor: "blue" },
    bob: { id: "bob", name: "Bob Brown", initials: "BB", avatarColor: "green" },
  };

  it("returns the day's records, the viewer first and then by name", () => {
    const entries = dayEntries(
      [
        record(8, { userId: "bob", user: people.bob }),
        record(8, { userId: VIEWER, user: people.viewer }),
        record(8, { userId: "anna", user: people.anna }),
        record(9, { userId: "anna", user: people.anna }),
      ],
      isoDate(2026, 9, 8),
      VIEWER
    );

    expect(entries.map((e) => e.userId)).toEqual([VIEWER, "anna", "bob"]);
  });
});

describe("toDayRecords", () => {
  function vacation(extra: Partial<VacationListItem>): VacationListItem {
    return {
      id: "v1",
      userId: "u1",
      groupId: "g1",
      requestedDay: "2026-09-08",
      startTime: null,
      endTime: null,
      vacationType: CalendarRecordType.Vacation,
      halfDay: false,
      note: null,
      rejectionReason: null,
      approvedAt: "2026-09-01T10:00:00.000Z",
      approvedBy: "boss",
      rejectedAt: null,
      rejectedBy: null,
      deletedAt: null,
      deletedByUserId: null,
      createdByUserId: null,
      requestId: "r1",
      createdAt: "2026-09-01T09:00:00.000Z",
      updatedAt: "2026-09-01T10:00:00.000Z",
      user: { id: "u1", name: "Anna Adams", initials: "AA", avatarColor: "blue" },
      canApprove: false,
      ...extra,
    };
  }

  it("returns one record per day with its pending and half-day marks", () => {
    const records = toDayRecords([
      vacation({ halfDay: true }),
      vacation({ id: "v2", requestedDay: "2026-09-09", approvedAt: null }),
    ]);

    expect(records).toMatchObject([
      { id: "v1", date: "2026-09-08", halfDay: true, pending: false },
      { id: "v2", date: "2026-09-09", halfDay: false, pending: true },
    ]);
  });

  it("drops rejected rows and types this build does not know", () => {
    const records = toDayRecords([
      vacation({ rejectedAt: "2026-09-02T10:00:00.000Z", approvedAt: null }),
      vacation({ id: "v2", vacationType: "TIME_TRAVEL" as CalendarRecordType }),
    ]);

    expect(records).toEqual([]);
  });
});
