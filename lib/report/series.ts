import type { MonthlyUsage, ReportScopeMember, ReportSummaryRow } from "@/lib/api/report-types";
import type { VacationKind } from "@/lib/api/types";

export const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export type MonthPoint = {
  month: number;
  used: number;
  pending: number;
};

/**
 * Twelve points per member, zero-filled. Charts need every month present or
 * a member who only took leave in March renders as a single floating bar.
 */
export function monthlySeriesFor(
  rows: MonthlyUsage[],
  userId: string,
  types?: VacationKind[]
): MonthPoint[] {
  const wanted = types && types.length > 0 ? new Set(types) : null;
  const byMonth = new Map<number, MonthPoint>(
    MONTHS.map((month) => [month, { month, used: 0, pending: 0 }])
  );

  for (const row of rows) {
    if (row.userId !== userId) continue;
    if (wanted && !wanted.has(row.vacationType)) continue;
    const point = byMonth.get(row.month);
    if (!point) continue;
    point.used += row.used;
    point.pending += row.pending;
  }

  return Array.from(byMonth.values());
}

/**
 * Everything a member has available for the year across every group they
 * appear in: the granted allowance plus whatever rolled over.
 */
export function totalQuotaFor(
  summary: ReportSummaryRow[],
  userId: string,
  types?: VacationKind[]
): number {
  const wanted = types && types.length > 0 ? new Set(types) : null;

  return summary
    .filter((row) => row.userId === userId && (!wanted || wanted.has(row.vacationType)))
    .reduce((total, row) => total + row.yearQuota + row.carriedOverDays, 0);
}

export type MemberCard = {
  member: ReportScopeMember;
  series: MonthPoint[];
  /** Granted allowance plus carry-over — what the chart's guide line uses. */
  quota: number;
  carriedOver: number;
  yearQuota: number;
  usedToDate: number;
  plannedRemaining: number;
  pending: number;
  remaining: number;
};

/**
 * One card per member, deduplicated across groups — someone in two teams
 * should appear once with their figures added up, not twice.
 */
export function buildMemberCards(
  members: ReportScopeMember[],
  monthly: MonthlyUsage[],
  summary: ReportSummaryRow[],
  types?: VacationKind[]
): MemberCard[] {
  const wanted = types && types.length > 0 ? new Set(types) : null;
  const seen = new Map<string, ReportScopeMember>();
  for (const member of members) {
    if (!seen.has(member.id)) seen.set(member.id, member);
  }

  return Array.from(seen.values())
    .map((member) => {
      const rows = summary.filter(
        (row) => row.userId === member.id && (!wanted || wanted.has(row.vacationType))
      );
      const sum = (pick: (row: ReportSummaryRow) => number) =>
        Number(rows.reduce((total, row) => total + pick(row), 0).toFixed(2));

      return {
        member,
        series: monthlySeriesFor(monthly, member.id, types),
        quota: totalQuotaFor(summary, member.id, types),
        carriedOver: sum((row) => row.carriedOverDays),
        yearQuota: sum((row) => row.yearQuota),
        usedToDate: sum((row) => row.usedToDate),
        plannedRemaining: sum((row) => row.plannedRemaining),
        pending: sum((row) => row.pending),
        remaining: sum((row) => row.remaining),
      };
    })
    .sort((a, b) => a.member.name.localeCompare(b.member.name));
}

/** Formats a day count without a trailing `.0`, so half days still read as 0.5. */
export function formatDays(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}
