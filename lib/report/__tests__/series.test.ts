import { describe, expect, it } from "vitest";
import {
  activeLeaveTypes,
  buildMemberRemaining,
  buildMemberCards,
  buildTeamMonthlySeries,
  calendarMonths,
  formatDays,
  monthAxisLabel,
  monthlyTargetFor,
  monthlySeriesFor,
  totalQuotaFor,
  trailingMonths,
  windowLabel,
  withYear,
  yearsInWindow,
} from "@/lib/report/series";
import type { DatedUsage } from "@/lib/report/series";
import type { MonthlyUsage, ReportScopeMember, ReportSummaryRow } from "@/lib/api/report-types";
import { VacationKind } from "@/lib/api/types";

const YEAR = 2026;
const months = calendarMonths(YEAR);

const usage = (over: Partial<DatedUsage> = {}): DatedUsage => ({
  userId: "u1",
  groupId: "g1",
  year: YEAR,
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
    const series = monthlySeriesFor([], "u1", months);

    expect(series).toHaveLength(12);
    expect(series.every((p) => p.used === 0 && p.pending === 0)).toBe(true);
    expect(series.map((p) => p.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("places usage in the matching month", () => {
    const series = monthlySeriesFor([usage()], "u1", months);

    expect(series[2]).toEqual({ year: YEAR, month: 3, used: 2, pending: 1 });
  });

  it("sums rows that share a month across groups and types", () => {
    const series = monthlySeriesFor(
      [usage(), usage({ groupId: "g2", used: 1, pending: 0 })],
      "u1",
      months
    );

    expect(series[2]).toEqual({ year: YEAR, month: 3, used: 3, pending: 1 });
  });

  it("ignores other members' rows", () => {
    const series = monthlySeriesFor([usage({ userId: "u2" })], "u1", months);

    expect(series[2]?.used).toBe(0);
  });

  it("applies the leave type filter", () => {
    const rows = [usage(), usage({ vacationType: VacationKind.Sick, used: 4 })];

    expect(monthlySeriesFor(rows, "u1", months, [VacationKind.Sick])[2]?.used).toBe(4);
  });

  it("treats an empty type filter as no filter", () => {
    expect(monthlySeriesFor([usage()], "u1", months, [])[2]?.used).toBe(2);
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
    const cards = buildMemberCards([member("u2", "Zoe Bell"), member("u1", "Ada Lovelace")], []);

    expect(cards.map((c) => c.member.name)).toEqual(["Ada Lovelace", "Zoe Bell"]);
  });

  it("collapses groups but never allowances", () => {
    const cards = buildMemberCards(
      [member("u1", "Ada Lovelace"), { ...member("u1", "Ada Lovelace"), groupId: "g2" }],
      []
    );

    expect(cards).toHaveLength(1);
  });

  it("adds up a member's figures across their groups", () => {
    const cards = buildMemberCards(
      [member("u1", "Ada Lovelace")],
      [summaryRow(), summaryRow({ groupId: "g2", usedToDate: 1, remaining: 4 })]
    );

    expect(cards[0]).toMatchObject({ usedToDate: 6, remaining: 20 });
  });

  it("keeps each allowance on its own card instead of summing them", () => {
    const cards = buildMemberCards(
      [member("u1", "Ada Lovelace")],
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
      [summaryRow({ usedToDate: 0.1 }), summaryRow({ groupId: "g2", usedToDate: 0.2 })]
    );

    expect(cards[0]?.usedToDate).toBe(0.3);
  });

  it("gives a member with no data a zeroed card rather than dropping them", () => {
    const cards = buildMemberCards([member("u9", "New Joiner")], []);

    expect(cards[0]).toMatchObject({ quota: 0, usedToDate: 0, remaining: 0 });
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
    const rows = buildTeamMonthlySeries([], ["u1", "u2"], VacationKind.Vacation, months);

    expect(rows).toHaveLength(12);
    expect(rows.map((r) => r.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(rows.every((r) => r.u1 === 0 && r.u2 === 0)).toBe(true);
  });

  it("sums used and pending into the member's month", () => {
    const rows = buildTeamMonthlySeries(
      [usage(), usage({ groupId: "g2", used: 0.5, pending: 0 })],
      ["u1"],
      VacationKind.Vacation,
      months
    );

    expect(rows[2].u1).toBe(3.5);
  });

  it("ignores other leave types and members outside the id list", () => {
    const rows = buildTeamMonthlySeries(
      [usage({ vacationType: VacationKind.HomeOffice }), usage({ userId: "ghost" })],
      ["u1"],
      VacationKind.Vacation,
      months
    );

    expect(rows[2].u1).toBe(0);
    expect(rows[2]).not.toHaveProperty("ghost");
  });
});

describe("calendarMonths", () => {
  it("returns January to December of the year", () => {
    const slots = calendarMonths(2026);

    expect(slots).toHaveLength(12);
    expect(slots[0]).toEqual({ year: 2026, month: 1 });
    expect(slots[11]).toEqual({ year: 2026, month: 12 });
  });
});

describe("trailingMonths", () => {
  it("ends with the month the date falls in", () => {
    const slots = trailingMonths(new Date(2026, 7, 22));

    expect(slots).toHaveLength(12);
    expect(slots[11]).toEqual({ year: 2026, month: 8 });
  });

  it("reaches back into the previous year", () => {
    const slots = trailingMonths(new Date(2026, 7, 22));

    expect(slots[0]).toEqual({ year: 2025, month: 9 });
    expect(slots.filter((slot) => slot.year === 2025)).toHaveLength(4);
  });

  it("stays inside one year when the date is in December", () => {
    const slots = trailingMonths(new Date(2026, 11, 31));

    expect(slots[0]).toEqual({ year: 2026, month: 1 });
    expect(slots[11]).toEqual({ year: 2026, month: 12 });
  });

  it("honours a shorter window", () => {
    expect(trailingMonths(new Date(2026, 2, 1), 3)).toEqual([
      { year: 2026, month: 1 },
      { year: 2026, month: 2 },
      { year: 2026, month: 3 },
    ]);
  });
});

describe("yearsInWindow", () => {
  it("returns the distinct years oldest first", () => {
    expect(yearsInWindow(trailingMonths(new Date(2026, 7, 22)))).toEqual([2025, 2026]);
  });

  it("returns a single year for a calendar window", () => {
    expect(yearsInWindow(calendarMonths(2026))).toEqual([2026]);
  });
});

describe("withYear", () => {
  it("stamps the overview's year onto every row", () => {
    const row: MonthlyUsage = {
      userId: "u1",
      groupId: "g1",
      month: 3,
      vacationType: VacationKind.Vacation,
      used: 2,
      pending: 1,
    };

    expect(withYear(2025, [row])).toEqual([{ ...row, year: 2025 }]);
  });
});

describe("monthAxisLabel", () => {
  const short = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  it("leaves the year off a single-year window", () => {
    const slots = calendarMonths(2026);

    expect(monthAxisLabel(1, slots, short)).toBe("Jan");
    expect(monthAxisLabel(12, slots, short)).toBe("Dec");
  });

  it("marks the first column and every January of a straddling window", () => {
    const slots = trailingMonths(new Date(2026, 7, 22));

    expect(monthAxisLabel(9, slots, short)).toBe("Sep '25");
    expect(monthAxisLabel(1, slots, short)).toBe("Jan '26");
    expect(monthAxisLabel(2, slots, short)).toBe("Feb");
  });

  // Recharts hides colliding ticks on a narrow chart and hands the formatter an
  // index into what is left, so the label must be derived from the value alone.
  it("labels a month the same however many ticks are rendered", () => {
    const slots = trailingMonths(new Date(2026, 7, 22));

    expect(monthAxisLabel(8, slots, short)).toBe("Aug");
    expect(monthAxisLabel(11, slots, short)).toBe("Nov");
  });

  it("falls back to the number for a month outside the window", () => {
    expect(monthAxisLabel(7, trailingMonths(new Date(2026, 2, 1), 3), short)).toBe("7");
  });
});

describe("buildMemberRemaining", () => {
  it("keeps taken and planned days apart so the tooltip can label them as the table does", () => {
    const bars = buildMemberRemaining(
      [member("u1", "Ada")],
      [summaryRow({ carriedOverDays: 3, yearQuota: 20, usedToDate: 4, plannedRemaining: 3 })],
      VacationKind.Vacation
    );

    expect(bars[0]).toMatchObject({ usedToDate: 4, planned: 3, used: 7, remaining: 16 });
  });

  it("splits what is left into carry-over and the year's own grant", () => {
    const bars = buildMemberRemaining(
      [member("u1", "Ada")],
      [summaryRow({ carriedOverDays: 3, yearQuota: 20, usedToDate: 0, plannedRemaining: 0 })],
      VacationKind.Vacation
    );

    expect(bars[0]).toMatchObject({
      carriedOverLeft: 3,
      yearLeft: 20,
      overdraft: 0,
      remaining: 23,
    });
  });

  it("spends the carry-over before the year's grant", () => {
    const bars = buildMemberRemaining(
      [member("u1", "Ada")],
      [summaryRow({ carriedOverDays: 3, yearQuota: 20, usedToDate: 2, plannedRemaining: 0 })],
      VacationKind.Vacation
    );

    expect(bars[0]).toMatchObject({ carriedOverLeft: 1, yearLeft: 20, remaining: 21 });
  });

  it("only starts on the year's grant once the carry-over is gone", () => {
    const bars = buildMemberRemaining(
      [member("u1", "Ada")],
      [summaryRow({ carriedOverDays: 3, yearQuota: 20, usedToDate: 5, plannedRemaining: 0 })],
      VacationKind.Vacation
    );

    expect(bars[0]).toMatchObject({ carriedOverLeft: 0, yearLeft: 18, remaining: 18 });
  });

  it("counts approved days still to come, not days awaiting approval", () => {
    const bars = buildMemberRemaining(
      [member("u1", "Ada")],
      [
        summaryRow({
          carriedOverDays: 0,
          yearQuota: 20,
          usedToDate: 4,
          plannedRemaining: 3,
          pending: 5,
        }),
      ],
      VacationKind.Vacation
    );

    expect(bars[0]).toMatchObject({ used: 7, pending: 5, yearLeft: 13, remaining: 13 });
  });

  it("hangs an overdraft below zero instead of clamping to nothing left", () => {
    const bars = buildMemberRemaining(
      [member("u1", "Ada")],
      [summaryRow({ carriedOverDays: 3, yearQuota: 20, usedToDate: 26, plannedRemaining: 0 })],
      VacationKind.Vacation
    );

    expect(bars[0]).toMatchObject({
      carriedOverLeft: 0,
      yearLeft: 0,
      overdraft: -3,
      remaining: -3,
    });
  });

  it("sums a member's allowance and usage across their groups", () => {
    const bars = buildMemberRemaining(
      [member("u1", "Ada"), { ...member("u1", "Ada"), groupId: "g2" }],
      [
        summaryRow({ carriedOverDays: 3, yearQuota: 20, usedToDate: 0, plannedRemaining: 0 }),
        summaryRow({
          groupId: "g2",
          carriedOverDays: 1,
          yearQuota: 5,
          usedToDate: 2,
          plannedRemaining: 0,
        }),
      ],
      VacationKind.Vacation
    );

    expect(bars).toHaveLength(1);
    expect(bars[0]).toMatchObject({ carriedOverLeft: 2, yearLeft: 25, remaining: 27 });
  });

  it("never lets another leave type top up the bar", () => {
    const bars = buildMemberRemaining(
      [member("u1", "Ada")],
      [
        summaryRow({ carriedOverDays: 3, yearQuota: 20, usedToDate: 0, plannedRemaining: 0 }),
        summaryRow({
          vacationType: VacationKind.HomeOffice,
          carriedOverDays: 0,
          yearQuota: 10,
          usedToDate: 0,
          plannedRemaining: 0,
        }),
      ],
      VacationKind.Vacation
    );

    expect(bars[0]?.remaining).toBe(23);
  });

  it("orders by days left descending, then by name", () => {
    const zeroed = { carriedOverDays: 0, usedToDate: 0, plannedRemaining: 0, pending: 0 };
    const bars = buildMemberRemaining(
      [member("u1", "Ada"), member("u2", "Zoe"), member("u3", "Bob")],
      [
        summaryRow({ userId: "u1", yearQuota: 10, ...zeroed }),
        summaryRow({ userId: "u2", yearQuota: 25, ...zeroed }),
        summaryRow({ userId: "u3", yearQuota: 10, ...zeroed }),
      ],
      VacationKind.Vacation
    );

    expect(bars.map((bar: { member: { name: string } }) => bar.member.name)).toEqual([
      "Zoe",
      "Ada",
      "Bob",
    ]);
  });

  it("keeps a member with no allowance rows on a zeroed bar", () => {
    const bars = buildMemberRemaining([member("u9", "New Joiner")], [], VacationKind.Vacation);

    expect(bars[0]).toMatchObject({ carriedOverLeft: 0, yearLeft: 0, remaining: 0 });
  });

  it("rounds accumulated half days instead of leaking float noise", () => {
    const bars = buildMemberRemaining(
      [member("u1", "Ada")],
      [
        summaryRow({ carriedOverDays: 0.1, yearQuota: 0, usedToDate: 0, plannedRemaining: 0 }),
        summaryRow({
          groupId: "g2",
          carriedOverDays: 0.2,
          yearQuota: 0,
          usedToDate: 0,
          plannedRemaining: 0,
        }),
      ],
      VacationKind.Vacation
    );

    expect(bars[0]?.carriedOverLeft).toBe(0.3);
  });
});

describe("monthlyTargetFor", () => {
  it("spreads the allowance evenly across a calendar year", () => {
    expect(monthlyTargetFor(calendarMonths(2026), 24)).toBe(2);
  });

  it("draws no line across a window that borrows from another year", () => {
    // The quota is one year's; those months were never measured against it.
    expect(monthlyTargetFor(trailingMonths(new Date(2026, 7, 22)), 24)).toBe(0);
  });

  it("draws no line when there is no allowance or no window", () => {
    expect(monthlyTargetFor(calendarMonths(2026), 0)).toBe(0);
    expect(monthlyTargetFor([], 24)).toBe(0);
  });
});

describe("windowLabel", () => {
  const short = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  it("names a whole calendar year by the year alone", () => {
    expect(windowLabel(calendarMonths(2026), short)).toBe("2026");
  });

  it("spells out both ends of a trailing window", () => {
    expect(windowLabel(trailingMonths(new Date(2026, 7, 22)), short)).toBe("Sep 2025 – Aug 2026");
  });

  it("returns an empty label for an empty window", () => {
    expect(windowLabel([], short)).toBe("");
  });
});
