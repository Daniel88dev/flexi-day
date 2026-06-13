import { describe, expect, it } from "vitest";
import { groupConsecutiveByUserType } from "../leave-calendar";
import { VacationKind } from "@/lib/api/types";

describe("groupConsecutiveByUserType", () => {
  it("returns an empty list when given no rows", () => {
    expect(groupConsecutiveByUserType([])).toEqual([]);
  });

  it("collapses three consecutive same-user/same-type days into a single range", () => {
    const ranges = groupConsecutiveByUserType([
      { userId: "u1", vacationType: VacationKind.Vacation, requestedDay: "2026-06-08" },
      { userId: "u1", vacationType: VacationKind.Vacation, requestedDay: "2026-06-09" },
      { userId: "u1", vacationType: VacationKind.Vacation, requestedDay: "2026-06-10" },
    ]);
    expect(ranges).toHaveLength(1);
    expect(ranges[0]).toMatchObject({ who: "u1", type: VacationKind.Vacation, from: 8, to: 10 });
  });

  it("splits when there is a one-day gap between days", () => {
    const ranges = groupConsecutiveByUserType([
      { userId: "u1", vacationType: VacationKind.Vacation, requestedDay: "2026-06-08" },
      { userId: "u1", vacationType: VacationKind.Vacation, requestedDay: "2026-06-10" },
    ]);
    expect(ranges).toHaveLength(2);
    expect(ranges[0].from).toBe(8);
    expect(ranges[0].to).toBe(8);
    expect(ranges[1].from).toBe(10);
    expect(ranges[1].to).toBe(10);
  });

  it("does not merge consecutive days when leave types differ", () => {
    const ranges = groupConsecutiveByUserType([
      { userId: "u1", vacationType: VacationKind.Vacation, requestedDay: "2026-06-08" },
      { userId: "u1", vacationType: VacationKind.HomeOffice, requestedDay: "2026-06-09" },
    ]);
    expect(ranges).toHaveLength(2);
  });

  it("does not merge consecutive days when users differ", () => {
    const ranges = groupConsecutiveByUserType([
      { userId: "u1", vacationType: VacationKind.Vacation, requestedDay: "2026-06-08" },
      { userId: "u2", vacationType: VacationKind.Vacation, requestedDay: "2026-06-09" },
    ]);
    expect(ranges).toHaveLength(2);
  });

  it("handles unsorted input by sorting before grouping", () => {
    const ranges = groupConsecutiveByUserType([
      { userId: "u1", vacationType: VacationKind.Vacation, requestedDay: "2026-06-10" },
      { userId: "u1", vacationType: VacationKind.Vacation, requestedDay: "2026-06-08" },
      { userId: "u1", vacationType: VacationKind.Vacation, requestedDay: "2026-06-09" },
    ]);
    expect(ranges).toHaveLength(1);
    expect(ranges[0]).toMatchObject({ from: 8, to: 10 });
  });
});
