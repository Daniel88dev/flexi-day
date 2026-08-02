import type { MonthlyUsage, ReportScopeMember, ReportSummaryRow } from "@/lib/api/report-types";
import { VacationKind } from "@/lib/api/types";

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
 * Granted allowance plus carry-over for ONE leave type, across every group the
 * member appears in. `leaveType` is required on purpose: the allowances are
 * independent, and summing them lets one cover an overdraft in another.
 */
export function totalQuotaFor(
  summary: ReportSummaryRow[],
  userId: string,
  leaveType: VacationKind
): number {
  return summary
    .filter((row) => row.userId === userId && row.vacationType === leaveType)
    .reduce((total, row) => total + row.yearQuota + row.carriedOverDays, 0);
}

export type MemberCard = {
  member: ReportScopeMember;
  vacationType: VacationKind;
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
 * One card per member and leave type. Groups are collapsed, allowances never
 * are — they are not interchangeable.
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

  // Taken across every member so the cards line up, with a fallback so a member
  // with nothing booked still gets a zeroed card rather than disappearing.
  const leaveTypes: VacationKind[] = [];
  for (const row of summary) {
    if (wanted && !wanted.has(row.vacationType)) continue;
    if (!leaveTypes.includes(row.vacationType)) leaveTypes.push(row.vacationType);
  }
  if (leaveTypes.length === 0) {
    leaveTypes.push(...(types && types.length > 0 ? types : [VacationKind.Vacation]));
  }

  const cards: MemberCard[] = [];

  for (const member of seen.values()) {
    const rows = summary.filter(
      (row) => row.userId === member.id && (!wanted || wanted.has(row.vacationType))
    );

    for (const leaveType of leaveTypes) {
      const typeRows = rows.filter((row) => row.vacationType === leaveType);
      const sum = (pick: (row: ReportSummaryRow) => number) =>
        Number(typeRows.reduce((total, row) => total + pick(row), 0).toFixed(2));

      cards.push({
        member,
        vacationType: leaveType,
        series: monthlySeriesFor(monthly, member.id, [leaveType]),
        quota: totalQuotaFor(summary, member.id, leaveType),
        carriedOver: sum((row) => row.carriedOverDays),
        yearQuota: sum((row) => row.yearQuota),
        usedToDate: sum((row) => row.usedToDate),
        plannedRemaining: sum((row) => row.plannedRemaining),
        pending: sum((row) => row.pending),
        remaining: sum((row) => row.remaining),
      });
    }
  }

  return cards.sort(
    (a, b) =>
      a.member.name.localeCompare(b.member.name) || a.vacationType.localeCompare(b.vacationType)
  );
}

/** Formats a day count without a trailing `.0`, so half days still read as 0.5. */
export function formatDays(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}
