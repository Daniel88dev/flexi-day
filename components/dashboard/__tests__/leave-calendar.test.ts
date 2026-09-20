import { describe, expect, it } from "vitest";
import { groupConsecutiveByUserType } from "../leave-calendar";
import { CalendarRecordType } from "@/lib/api/types";

describe("groupConsecutiveByUserType", () => {
  it("returns an empty list when given no rows", () => {
    expect(groupConsecutiveByUserType([])).toEqual([]);
  });

  it("collapses three consecutive same-user/same-type days into a single range", () => {
    const ranges = groupConsecutiveByUserType([
      { userId: "u1", vacationType: CalendarRecordType.Vacation, requestedDay: "2026-06-08" },
      { userId: "u1", vacationType: CalendarRecordType.Vacation, requestedDay: "2026-06-09" },
      { userId: "u1", vacationType: CalendarRecordType.Vacation, requestedDay: "2026-06-10" },
    ]);
    expect(ranges).toHaveLength(1);
    expect(ranges[0]).toMatchObject({
      who: "u1",
      type: CalendarRecordType.Vacation,
      from: 8,
      to: 10,
    });
  });

  it("splits when there is a one-day gap between days", () => {
    const ranges = groupConsecutiveByUserType([
      { userId: "u1", vacationType: CalendarRecordType.Vacation, requestedDay: "2026-06-08" },
      { userId: "u1", vacationType: CalendarRecordType.Vacation, requestedDay: "2026-06-10" },
    ]);
    expect(ranges).toHaveLength(2);
    expect(ranges[0].from).toBe(8);
    expect(ranges[0].to).toBe(8);
    expect(ranges[1].from).toBe(10);
    expect(ranges[1].to).toBe(10);
  });

  it("does not merge consecutive days when leave types differ", () => {
    const ranges = groupConsecutiveByUserType([
      { userId: "u1", vacationType: CalendarRecordType.Vacation, requestedDay: "2026-06-08" },
      { userId: "u1", vacationType: CalendarRecordType.HomeOffice, requestedDay: "2026-06-09" },
    ]);
    expect(ranges).toHaveLength(2);
  });

  it("does not merge consecutive days when users differ", () => {
    const ranges = groupConsecutiveByUserType([
      { userId: "u1", vacationType: CalendarRecordType.Vacation, requestedDay: "2026-06-08" },
      { userId: "u2", vacationType: CalendarRecordType.Vacation, requestedDay: "2026-06-09" },
    ]);
    expect(ranges).toHaveLength(2);
  });

  it("carries the mirror source onto the range", () => {
    const ranges = groupConsecutiveByUserType([
      {
        userId: "u1",
        vacationType: CalendarRecordType.Vacation,
        requestedDay: "2026-06-08",
        mirroredFromGroupName: "Team B",
      },
    ]);
    expect(ranges[0].mirroredFrom).toBe("Team B");
  });

  it("does not merge consecutive days that come from different source groups", () => {
    const ranges = groupConsecutiveByUserType([
      {
        userId: "u1",
        vacationType: CalendarRecordType.Vacation,
        requestedDay: "2026-06-08",
        mirroredFromGroupName: null,
      },
      {
        userId: "u1",
        vacationType: CalendarRecordType.Vacation,
        requestedDay: "2026-06-09",
        mirroredFromGroupName: "Team B",
      },
    ]);
    expect(ranges).toHaveLength(2);
  });

  it("gives every range an id of its own", () => {
    const ranges = groupConsecutiveByUserType([
      { userId: "u1", vacationType: CalendarRecordType.Vacation, requestedDay: "2026-06-08" },
      { userId: "u1", vacationType: CalendarRecordType.Vacation, requestedDay: "2026-06-10" },
      { userId: "u2", vacationType: CalendarRecordType.Vacation, requestedDay: "2026-06-08" },
      { userId: "u1", vacationType: CalendarRecordType.HomeOffice, requestedDay: "2026-06-08" },
    ]);

    expect(new Set(ranges.map((r) => r.id)).size).toBe(ranges.length);
  });

  it("keeps a range's id the same when another range is dropped from the input", () => {
    const rows = [
      { userId: "u1", vacationType: CalendarRecordType.Vacation, requestedDay: "2026-06-08" },
      { userId: "u2", vacationType: CalendarRecordType.Vacation, requestedDay: "2026-06-09" },
      { userId: "u3", vacationType: CalendarRecordType.Vacation, requestedDay: "2026-06-10" },
    ];

    const before = groupConsecutiveByUserType(rows);
    const after = groupConsecutiveByUserType(rows.filter((r) => r.userId !== "u1"));

    expect(after.map((r) => r.id)).toEqual(before.slice(1).map((r) => r.id));
  });

  it("handles unsorted input by sorting before grouping", () => {
    const ranges = groupConsecutiveByUserType([
      { userId: "u1", vacationType: CalendarRecordType.Vacation, requestedDay: "2026-06-10" },
      { userId: "u1", vacationType: CalendarRecordType.Vacation, requestedDay: "2026-06-08" },
      { userId: "u1", vacationType: CalendarRecordType.Vacation, requestedDay: "2026-06-09" },
    ]);
    expect(ranges).toHaveLength(1);
    expect(ranges[0]).toMatchObject({ from: 8, to: 10 });
  });
});
