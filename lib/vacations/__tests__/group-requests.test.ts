import { describe, expect, it } from "vitest";
import { groupVacationRequests } from "../group-requests";
import { VacationKind, type VacationListItem } from "@/lib/api/types";

const user = { id: "u-1", name: "Dana", initials: "DA", avatarColor: "hsl(0 0% 50%)" };

function vac(
  overrides: Partial<VacationListItem> & { id: string; requestedDay: string }
): VacationListItem {
  return {
    userId: "u-1",
    groupId: "g-1",
    startTime: null,
    endTime: null,
    vacationType: VacationKind.Vacation,
    note: null,
    rejectionReason: null,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    deletedAt: null,
    createdAt: "2026-07-20T09:00:00.000Z",
    updatedAt: "2026-07-20T09:00:00.000Z",
    user,
    ...overrides,
  };
}

describe("groupVacationRequests", () => {
  it("collapses a contiguous same-type run into one range", () => {
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

  it("splits on a calendar gap", () => {
    const groups = groupVacationRequests([
      vac({ id: "a", requestedDay: "2026-08-17" }),
      vac({ id: "b", requestedDay: "2026-08-18" }),
      vac({ id: "c", requestedDay: "2026-08-20" }),
    ]);

    expect(groups.map((g) => [g.from, g.to])).toEqual([
      ["2026-08-17", "2026-08-18"],
      ["2026-08-20", "2026-08-20"],
    ]);
  });

  it("does not merge across status, so a partially-approved request splits", () => {
    const groups = groupVacationRequests([
      vac({ id: "a", requestedDay: "2026-08-17", approvedAt: "2026-08-01T09:00:00.000Z" }),
      vac({ id: "b", requestedDay: "2026-08-18" }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.status)).toEqual(["approved", "pending"]);
  });

  it("does not merge different leave types on adjacent days", () => {
    const groups = groupVacationRequests([
      vac({ id: "a", requestedDay: "2026-08-17", vacationType: VacationKind.Vacation }),
      vac({ id: "b", requestedDay: "2026-08-18", vacationType: VacationKind.HomeOffice }),
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

  it("returns [] for no input", () => {
    expect(groupVacationRequests([])).toEqual([]);
  });
});
