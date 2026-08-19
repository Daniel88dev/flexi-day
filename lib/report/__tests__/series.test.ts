import { describe, expect, it } from "vitest";
import {
  activeLeaveTypes,
  buildMemberCards,
  buildTeamMonthlySeries,
  formatDays,
  monthlySeriesFor,
  totalQuotaFor,
} from "@/lib/report/series";
import type { MonthlyUsage, ReportScopeMember, ReportSummaryRow } from "@/lib/api/report-types";
import { VacationKind } from "@/lib/api/types";

const usage = (over: Partial<MonthlyUsage> = {}): MonthlyUsage => ({
  userId: "u1",
  groupId: "g1",
  month: 3,
  vacationType: VacationKind.Vacation,
  used: 2,
  pending: 1,
  ...over,
});

const summaryRow = (over: Partial<ReportSummaryRow> = {}): ReportSummaryRow => ({
  userId: "u1",
  groupId: "g1",
  vacationType: VacationKind.Vacation,
  carriedOverDays: 3,
  yearQuota: 20,
  usedToDate: 5,
  plannedRemaining: 2,
  pending: 1,
  remaining: 16,
  ...over,
});

const member = (id: string, name: string): ReportScopeMember => ({
  id,
  name,
  initials: name.slice(0, 2).toUpperCase(),
  avatarColor: "hsl(200, 65%, 50%)",
  groupId: "g1",
});

describe("monthlySeriesFor", () => {
  it("returns twelve zero-filled months", () => {
    const series = monthlySeriesFor([], "u1");

    expect(series).toHaveLength(12);
    expect(series.every((p) => p.used === 0 && p.pending === 0)).toBe(true);
    expect(series.map((p) => p.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("places usage in the matching month", () => {
    const series = monthlySeriesFor([usage()], "u1");

    expect(series[2]).toEqual({ month: 3, used: 2, pending: 1 });
  });

  it("sums rows that share a month across groups and types", () => {
    const series = monthlySeriesFor([usage(), usage({ groupId: "g2", used: 1, pending: 0 })], "u1");

    expect(series[2]).toEqual({ month: 3, used: 3, pending: 1 });
  });

  it("ignores other members' rows", () => {
    const series = monthlySeriesFor([usage({ userId: "u2" })], "u1");

    expect(series[2]?.used).toBe(0);
  });

  it("applies the leave type filter", () => {
    const rows = [usage(), usage({ vacationType: VacationKind.Sick, used: 4 })];

    expect(monthlySeriesFor(rows, "u1", [VacationKind.Sick])[2]?.used).toBe(4);
  });

  it("treats an empty type filter as no filter", () => {
    expect(monthlySeriesFor([usage()], "u1", [])[2]?.used).toBe(2);
  });
});

describe("totalQuotaFor", () => {
  it("adds carry-over to the yearly allowance", () => {
    expect(totalQuotaFor([summaryRow()], "u1", VacationKind.Vacation)).toBe(23);
  });

  it("sums a member's allowance across groups", () => {
    const rows = [summaryRow(), summaryRow({ groupId: "g2", yearQuota: 10, carriedOverDays: 0 })];

    expect(totalQuotaFor(rows, "u1", VacationKind.Vacation)).toBe(33);
  });

  it("returns 0 for a member with no allowance rows", () => {
    expect(totalQuotaFor([summaryRow()], "unknown", VacationKind.Vacation)).toBe(0);
  });

  it("counts only the requested allowance", () => {
    const rows = [
      summaryRow(),
      summaryRow({ vacationType: VacationKind.HomeOffice, yearQuota: 10, carriedOverDays: 0 }),
    ];

    expect(totalQuotaFor(rows, "u1", VacationKind.HomeOffice)).toBe(10);
  });

  it("never lets one allowance top up another", () => {
    const rows = [
      summaryRow({ yearQuota: 25, carriedOverDays: 3 }),
      summaryRow({ vacationType: VacationKind.HomeOffice, yearQuota: 10, carriedOverDays: 0 }),
    ];

    expect(totalQuotaFor(rows, "u1", VacationKind.Vacation)).toBe(28);
  });
});

describe("buildMemberCards", () => {
  it("returns one card per member sorted by name", () => {
    const cards = buildMemberCards(
      [member("u2", "Zoe Bell"), member("u1", "Ada Lovelace")],
      [],
      []
    );

    expect(cards.map((c) => c.member.name)).toEqual(["Ada Lovelace", "Zoe Bell"]);
  });

  it("collapses groups but never allowances", () => {
    const cards = buildMemberCards(
      [member("u1", "Ada Lovelace"), { ...member("u1", "Ada Lovelace"), groupId: "g2" }],
      [],
      []
    );

    expect(cards).toHaveLength(1);
  });

  it("adds up a member's figures across their groups", () => {
    const cards = buildMemberCards(
      [member("u1", "Ada Lovelace")],
      [],
      [summaryRow(), summaryRow({ groupId: "g2", usedToDate: 1, remaining: 4 })]
    );

    expect(cards[0]).toMatchObject({ usedToDate: 6, remaining: 20 });
  });

  it("keeps each allowance on its own card instead of summing them", () => {
    const cards = buildMemberCards(
      [member("u1", "Ada Lovelace")],
      [],
      [
        summaryRow({ yearQuota: 25, carriedOverDays: 3, usedToDate: 33, remaining: -5 }),
        summaryRow({
          vacationType: VacationKind.HomeOffice,
          yearQuota: 10,
          carriedOverDays: 0,
          usedToDate: 0,
          plannedRemaining: 0,
          pending: 0,
          remaining: 10,
        }),
      ]
    );

    expect(cards).toHaveLength(2);
    // An untouched home-office allowance must not mask the vacation overdraft.
    expect(cards.find((c) => c.vacationType === VacationKind.Vacation)).toMatchObject({
      quota: 28,
      remaining: -5,
    });
    expect(cards.find((c) => c.vacationType === VacationKind.HomeOffice)).toMatchObject({
      quota: 10,
      remaining: 10,
    });
  });

  it("rounds accumulated half days instead of leaking float noise", () => {
    const cards = buildMemberCards(
      [member("u1", "Ada Lovelace")],
      [],
      [summaryRow({ usedToDate: 0.1 }), summaryRow({ groupId: "g2", usedToDate: 0.2 })]
    );

    expect(cards[0]?.usedToDate).toBe(0.3);
  });

  it("gives a member with no data a zeroed card rather than dropping them", () => {
    const cards = buildMemberCards([member("u9", "New Joiner")], [], []);

    expect(cards[0]).toMatchObject({ quota: 0, usedToDate: 0, remaining: 0 });
    expect(cards[0]?.series).toHaveLength(12);
  });
});

describe("formatDays", () => {
  it("prints whole days without decimals", () => {
    expect(formatDays(3)).toBe("3");
  });

  it("keeps a half day visible", () => {
    expect(formatDays(2.5)).toBe("2.5");
  });

  it("prints zero as 0", () => {
    expect(formatDays(0)).toBe("0");
  });

  it("keeps a negative overdraft readable", () => {
    expect(formatDays(-1.5)).toBe("-1.5");
  });
});

describe("activeLeaveTypes", () => {
  it("returns types in first-seen summary order", () => {
    const rows = [
      summaryRow({ vacationType: VacationKind.HomeOffice }),
      summaryRow({ vacationType: VacationKind.Vacation }),
      summaryRow({ vacationType: VacationKind.HomeOffice, userId: "u2" }),
    ];

    expect(activeLeaveTypes(rows)).toEqual([VacationKind.HomeOffice, VacationKind.Vacation]);
  });

  it("respects the type filter", () => {
    const rows = [
      summaryRow({ vacationType: VacationKind.HomeOffice }),
      summaryRow({ vacationType: VacationKind.Vacation }),
    ];

    expect(activeLeaveTypes(rows, [VacationKind.Vacation])).toEqual([VacationKind.Vacation]);
  });

  it("falls back to the filter, then to Vacation, when the summary is empty", () => {
    expect(activeLeaveTypes([], [VacationKind.Sick])).toEqual([VacationKind.Sick]);
    expect(activeLeaveTypes([])).toEqual([VacationKind.Vacation]);
  });
});

describe("buildTeamMonthlySeries", () => {
  it("returns twelve rows with every member zero-filled", () => {
    const rows = buildTeamMonthlySeries([], ["u1", "u2"], VacationKind.Vacation);

    expect(rows).toHaveLength(12);
    expect(rows.map((r) => r.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(rows.every((r) => r.u1 === 0 && r.u2 === 0)).toBe(true);
  });

  it("sums used and pending into the member's month", () => {
    const rows = buildTeamMonthlySeries(
      [usage(), usage({ groupId: "g2", used: 0.5, pending: 0 })],
      ["u1"],
      VacationKind.Vacation
    );

    expect(rows[2].u1).toBe(3.5);
  });

  it("ignores other leave types and members outside the id list", () => {
    const rows = buildTeamMonthlySeries(
      [usage({ vacationType: VacationKind.HomeOffice }), usage({ userId: "ghost" })],
      ["u1"],
      VacationKind.Vacation
    );

    expect(rows[2].u1).toBe(0);
    expect(rows[2]).not.toHaveProperty("ghost");
  });
});
