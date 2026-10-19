import { describe, expect, it } from "vitest";
import { groupVacationRequests } from "../group-requests";
import { CalendarRecordType, type VacationListItem } from "@/lib/api/types";

const user = { id: "u-1", name: "Dana", initials: "DA", avatarColor: "hsl(0 0% 50%)" };

function vac(
  overrides: Partial<VacationListItem> & { id: string; requestedDay: string }
): VacationListItem {
  return {
    userId: "u-1",
    groupId: "g-1",
    requestId: "r-1",
    startTime: null,
    endTime: null,
    vacationType: CalendarRecordType.Vacation,
    halfDay: false,
    note: null,
    rejectionReason: null,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    deletedAt: null,
    deletedByUserId: null,
    createdByUserId: null,
    createdAt: "2026-07-20T09:00:00.000Z",
    updatedAt: "2026-07-20T09:00:00.000Z",
    canApprove: false,
    user,
    ...overrides,
  };
}

describe("groupVacationRequests", () => {
  it("collapses the days of one Request into one range", () => {
    const groups = groupVacationRequests([
      vac({ id: "a", requestedDay: "2026-08-17" }),
      vac({ id: "b", requestedDay: "2026-08-18" }),
      vac({ id: "c", requestedDay: "2026-08-19" }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      id: "a",
      from: "2026-08-17",
      to: "2026-08-19",
      dayCount: 3,
      vacationIds: ["a", "b", "c"],
    });
  });

  it("splits a half day off an adjacent full day", () => {
    const groups = groupVacationRequests([
      vac({ id: "a", requestedDay: "2026-08-17" }),
      vac({ id: "b", requestedDay: "2026-08-18", halfDay: true }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.halfDay)).toEqual([false, true]);
  });

  it("keeps a run of half days together", () => {
    const groups = groupVacationRequests([
      vac({ id: "a", requestedDay: "2026-08-17", halfDay: true }),
      vac({ id: "b", requestedDay: "2026-08-18", halfDay: true }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ halfDay: true, dayCount: 2 });
  });

  it("keeps a Request across a weekend and a month edge as one group with every id", () => {
    const groups = groupVacationRequests([
      vac({ id: "a", requestedDay: "2026-10-29" }),
      vac({ id: "b", requestedDay: "2026-10-30" }),
      vac({ id: "c", requestedDay: "2026-11-02" }),
      vac({ id: "d", requestedDay: "2026-11-03" }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      id: "a",
      from: "2026-10-29",
      to: "2026-11-03",
      dayCount: 4,
      vacationIds: ["a", "b", "c", "d"],
    });
  });

  it("keeps two Requests on adjacent days as two groups", () => {
    const groups = groupVacationRequests([
      vac({ id: "a", requestedDay: "2026-08-17", requestId: "r-1" }),
      vac({ id: "b", requestedDay: "2026-08-18", requestId: "r-1" }),
      vac({ id: "c", requestedDay: "2026-08-19", requestId: "r-2" }),
    ]);

    expect(groups.map((g) => g.vacationIds)).toEqual([["a", "b"], ["c"]]);
  });

  it("splits a partly approved Request into one group per state", () => {
    const approvedAt = "2026-10-20T09:00:00.000Z";
    const groups = groupVacationRequests([
      vac({ id: "a", requestedDay: "2026-10-29", approvedAt }),
      vac({ id: "b", requestedDay: "2026-10-30" }),
      vac({ id: "c", requestedDay: "2026-11-02", approvedAt }),
      vac({ id: "d", requestedDay: "2026-11-03" }),
    ]);

    expect(groups.map((g) => [g.status, g.vacationIds])).toEqual([
      ["approved", ["a", "c"]],
      ["pending", ["b", "d"]],
    ]);
  });

  it("orders a Request's days however the rows arrive", () => {
    const groups = groupVacationRequests([
      vac({ id: "c", requestedDay: "2026-11-02" }),
      vac({ id: "a", requestedDay: "2026-10-29" }),
    ]);

    expect(groups[0]).toMatchObject({ id: "a", from: "2026-10-29", to: "2026-11-02" });
    expect(groups[0].vacationIds).toEqual(["a", "c"]);
  });

  it("does not merge different leave types on adjacent days", () => {
    const groups = groupVacationRequests([
      vac({ id: "a", requestedDay: "2026-08-17", vacationType: CalendarRecordType.Vacation }),
      vac({ id: "b", requestedDay: "2026-08-18", vacationType: CalendarRecordType.HomeOffice }),
    ]);

    expect(groups).toHaveLength(2);
  });

  it("keeps different users' adjacent days apart", () => {
    const groups = groupVacationRequests([
      vac({ id: "a", requestedDay: "2026-08-17", userId: "u-1" }),
      vac({
        id: "b",
        requestedDay: "2026-08-18",
        userId: "u-2",
        user: { ...user, id: "u-2", name: "Eve" },
      }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.every((g) => g.dayCount === 1)).toBe(true);
  });

  it("carries a mirrored run's source group name, and null otherwise", () => {
    const groups = groupVacationRequests([
      vac({ id: "a", requestedDay: "2026-08-17" }),
      vac({
        id: "b",
        requestedDay: "2026-08-17",
        groupId: "g-2",
        mirroredFromGroupId: "g-2",
        mirroredFromGroupName: "Sales",
      }),
    ]);

    expect(groups.map((g) => [g.groupId, g.mirroredFromGroupName])).toEqual([
      ["g-1", null],
      ["g-2", "Sales"],
    ]);
  });

  it("returns [] for no input", () => {
    expect(groupVacationRequests([])).toEqual([]);
  });
});
