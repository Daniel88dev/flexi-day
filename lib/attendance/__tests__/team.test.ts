import { describe, expect, it } from "vitest";
import type { AttendanceTeamPerson } from "@/lib/api/attendance";
import type { GroupListItem } from "@/lib/api/types";
import {
  anyPresence,
  daysInRange,
  defaultDay,
  rangeOf,
  stepAnchor,
  teamOrganizations,
  weekRange,
} from "../team";

describe("weekRange", () => {
  it("runs Monday to Sunday around the anchor", () => {
    expect(weekRange("2026-09-11")).toEqual({ from: "2026-09-07", to: "2026-09-13" });
    expect(weekRange("2026-09-13")).toEqual({ from: "2026-09-07", to: "2026-09-13" });
  });
});

describe("rangeOf", () => {
  const custom = { from: "2026-01-05", to: "2026-01-09" };

  it("reads the week or the month at the anchor, and leaves a custom range alone", () => {
    expect(rangeOf("week", "2026-09-11", custom)).toEqual(weekRange("2026-09-11"));
    expect(rangeOf("month", "2026-09-11", custom)).toEqual({
      from: "2026-09-01",
      to: "2026-09-30",
    });
    expect(rangeOf("range", "2026-09-11", custom)).toEqual(custom);
  });

  it("covers the whole month, leap February included", () => {
    expect(rangeOf("month", "2028-02-10", custom)).toEqual({
      from: "2028-02-01",
      to: "2028-02-29",
    });
  });
});

describe("stepAnchor", () => {
  it("moves a week by seven days from its Monday", () => {
    expect(stepAnchor("week", "2026-09-11", 1)).toBe("2026-09-14");
    expect(stepAnchor("week", "2026-09-11", -1)).toBe("2026-08-31");
  });

  it("moves a month to the first of the next or previous one", () => {
    expect(stepAnchor("month", "2026-09-11", 1)).toBe("2026-10-01");
    expect(stepAnchor("month", "2026-01-31", -1)).toBe("2025-12-01");
  });
});

describe("daysInRange", () => {
  it("counts both ends", () => {
    expect(daysInRange({ from: "2026-09-07", to: "2026-09-13" })).toBe(7);
    expect(daysInRange({ from: "2026-09-07", to: "2026-09-07" })).toBe(1);
  });

  it("is zero or less for a range inside out or unreadable", () => {
    expect(daysInRange({ from: "2026-09-13", to: "2026-09-07" })).toBe(-5);
    expect(daysInRange({ from: "", to: "2026-09-07" })).toBe(0);
  });
});

describe("defaultDay", () => {
  const range = { from: "2026-09-07", to: "2026-09-13" };

  it("opens on today when it is in the range", () => {
    expect(defaultDay(range, "2026-09-11")).toBe("2026-09-11");
  });

  it("opens on the nearest end otherwise, and on the end when today is unknown", () => {
    expect(defaultDay(range, "2026-09-20")).toBe("2026-09-13");
    expect(defaultDay(range, "2026-09-01")).toBe("2026-09-07");
    expect(defaultDay(range, null)).toBe("2026-09-13");
  });
});

describe("teamOrganizations", () => {
  const group = (overrides: Partial<GroupListItem>): GroupListItem =>
    ({
      id: "g",
      organizationId: "org-2",
      organization: { id: "org-2", name: "Other org" } as GroupListItem["organization"],
      groupName: "Engineering",
      managerUserId: "someone",
      ...overrides,
    }) as GroupListItem;

  it("puts the administered organization first and adds the groups' organizations once", () => {
    const groups = [
      group({ id: "g1", managerUserId: "me" }),
      group({ id: "g2", membership: { adminAccess: true, approverAccess: false } }),
      group({
        id: "g3",
        organizationId: "org-1",
        organization: { id: "org-1", name: "Mine" } as GroupListItem["organization"],
      }),
    ];

    expect(teamOrganizations({ id: "org-1", name: "Mine" }, groups, "me")).toEqual([
      { id: "org-1", name: "Mine" },
      { id: "org-2", name: "Other org" },
    ]);
  });

  it("ignores groups the viewer merely belongs to", () => {
    const groups = [group({ membership: { adminAccess: false, approverAccess: true } })];

    expect(teamOrganizations(null, groups, "me")).toEqual([]);
  });

  it("falls back to the group's name when the organization is not on the group", () => {
    expect(
      teamOrganizations(null, [group({ organization: null, managerUserId: "me" })], "me")
    ).toEqual([{ id: "org-2", name: "Engineering" }]);
  });
});

describe("anyPresence", () => {
  const person = (presence: number[]): AttendanceTeamPerson =>
    ({ days: presence.map((presenceMinutes) => ({ presenceMinutes })) }) as AttendanceTeamPerson;

  it("is true once anybody was at work on any day", () => {
    expect(anyPresence([person([0, 0]), person([0, 30])])).toBe(true);
    expect(anyPresence([person([0, 0]), person([0])])).toBe(false);
    expect(anyPresence([])).toBe(false);
  });
});
