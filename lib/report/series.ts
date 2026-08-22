import type { MonthlyUsage, ReportScopeMember, ReportSummaryRow } from "@/lib/api/report-types";
import { VacationKind } from "@/lib/api/types";

export const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/** One chart column: a calendar month in a specific year. */
export type MonthSlot = { year: number; month: number };

/**
 * The overview endpoint is year-scoped, so its rows carry a month but no year.
 * A window that crosses New Year needs it back, so it is stamped on at merge.
 */
export type DatedUsage = MonthlyUsage & { year: number };

export function withYear(year: number, rows: MonthlyUsage[]): DatedUsage[] {
  return rows.map((row) => ({ ...row, year }));
}

export function calendarMonths(year: number): MonthSlot[] {
  return MONTHS.map((month) => ({ year, month }));
}

/**
 * The `count` months ending with the one `today` falls in. Stopping at the
 * current month is the point: leave booked for later is a plan, not usage, and
 * trailing near-empty columns flatten everything that actually happened.
 */
export function trailingMonths(today: Date, count = 12): MonthSlot[] {
  const slots: MonthSlot[] = [];
  for (let back = count - 1; back >= 0; back--) {
    const date = new Date(today.getFullYear(), today.getMonth() - back, 1);
    slots.push({ year: date.getFullYear(), month: date.getMonth() + 1 });
  }
  return slots;
}

/** Distinct years a window touches, oldest first. */
export function yearsInWindow(slots: MonthSlot[]): number[] {
  return Array.from(new Set(slots.map((slot) => slot.year))).sort((a, b) => a - b);
}

const slotKey = (year: number, month: number) => `${year}-${month}`;

/**
 * Bare month, plus a short year wherever a multi-year window turns over. Keyed
 * on the month value, not its position: a narrow chart renders only a subset of
 * the ticks, and the index recharts hands the formatter is into that subset.
 */
export function monthAxisLabel(
  month: number,
  slots: MonthSlot[],
  monthsShort: readonly string[]
): string {
  const index = slots.findIndex((slot) => slot.month === month);
  const slot = slots[index];
  if (!slot) return String(month);

  const label = monthsShort[slot.month - 1] ?? String(slot.month);
  if (yearsInWindow(slots).length < 2) return label;
  if (index === 0 || slot.month === 1) return `${label} '${String(slot.year).slice(-2)}`;
  return label;
}

/**
 * What the window covers, in words. A trailing window is not self-evident from
 * the axis alone, and the surrounding page is still labelled by calendar year.
 */
export function windowLabel(slots: MonthSlot[], monthsShort: readonly string[]): string {
  const first = slots[0];
  const last = slots[slots.length - 1];
  if (!first || !last) return "";
  if (first.year === last.year && first.month === 1 && last.month === 12) {
    return String(first.year);
  }
  const name = (slot: MonthSlot) => `${monthsShort[slot.month - 1] ?? slot.month} ${slot.year}`;
  return `${name(first)} \u2013 ${name(last)}`;
}

export type MonthPoint = MonthSlot & {
  used: number;
  pending: number;
};

/**
 * One point per slot, zero-filled. Charts need every month present or a member
 * who only took leave in March renders as a single floating bar.
 */
export function monthlySeriesFor(
  rows: DatedUsage[],
  userId: string,
  slots: MonthSlot[],
  types?: VacationKind[]
): MonthPoint[] {
  const wanted = types && types.length > 0 ? new Set(types) : null;
  const byKey = new Map<string, MonthPoint>(
    slots.map((slot) => [slotKey(slot.year, slot.month), { ...slot, used: 0, pending: 0 }])
  );

  for (const row of rows) {
    if (row.userId !== userId) continue;
    if (wanted && !wanted.has(row.vacationType)) continue;
    const point = byKey.get(slotKey(row.year, row.month));
    if (!point) continue;
    point.used += row.used;
    point.pending += row.pending;
  }

  return Array.from(byKey.values());
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

/**
 * Leave types worth charting for the current filters, in first-seen summary
 * order, with a fallback so an empty summary still yields one chart/card per
 * member instead of nothing.
 */
export function activeLeaveTypes(
  summary: ReportSummaryRow[],
  types?: VacationKind[]
): VacationKind[] {
  const wanted = types && types.length > 0 ? new Set(types) : null;
  const leaveTypes: VacationKind[] = [];
  for (const row of summary) {
    if (wanted && !wanted.has(row.vacationType)) continue;
    if (!leaveTypes.includes(row.vacationType)) leaveTypes.push(row.vacationType);
  }
  if (leaveTypes.length === 0) {
    leaveTypes.push(...(types && types.length > 0 ? types : [VacationKind.Vacation]));
  }
  return leaveTypes;
}

/** One row per slot; every member id present as a key, zero-filled. */
/**
 * The per-month allowance guide line, or 0 for no line. `quota` belongs to one
 * calendar year, so a window that borrows months from another year has no
 * honest average to draw — those bars were never measured against it.
 */
export function monthlyTargetFor(slots: MonthSlot[], quota: number): number {
  if (quota <= 0 || slots.length === 0) return 0;
  if (yearsInWindow(slots).length > 1) return 0;
  return quota / slots.length;
}

export type TeamMonthRow = MonthSlot & Record<string, number>;

/**
 * Rows keyed by member id for the aggregate team chart. A member's value is
 * used + pending — the bar reads as "committed days"; the split is surfaced in
 * tooltips and the table instead.
 */
export function buildTeamMonthlySeries(
  usage: DatedUsage[],
  memberIds: string[],
  leaveType: VacationKind,
  slots: MonthSlot[]
): TeamMonthRow[] {
  const ids = new Set(memberIds);
  const byKey = new Map<string, TeamMonthRow>();
  for (const slot of slots) {
    const row: TeamMonthRow = { ...slot };
    for (const id of memberIds) row[id] = 0;
    byKey.set(slotKey(slot.year, slot.month), row);
  }

  for (const entry of usage) {
    if (entry.vacationType !== leaveType || !ids.has(entry.userId)) continue;
    const row = byKey.get(slotKey(entry.year, entry.month));
    if (!row) continue;
    row[entry.userId] = Number((row[entry.userId] + entry.used + entry.pending).toFixed(2));
  }

  return Array.from(byKey.values());
}

/**
 * What one member has left of one allowance, split by the year the days came
 * from. Carry-over is drawn down before the year's own grant, which is the
 * order the allowance actually expires in.
 */
export type MemberRemaining = {
  member: ReportScopeMember;
  /** Granted: brought in from last year. */
  carriedOver: number;
  /** Granted: for the year itself. */
  yearQuota: number;
  /** Approved days already taken. */
  usedToDate: number;
  /** Approved days still ahead. */
  planned: number;
  /** `usedToDate + planned` — what actually draws the allowance down. */
  used: number;
  /** Awaiting approval, so not yet drawn down. */
  pending: number;
  /** Left of the carry-over. */
  carriedOverLeft: number;
  /** Left of the year's own grant. */
  yearLeft: number;
  /** Taken beyond the whole allowance, as a negative so it stacks below zero. */
  overdraft: number;
  /** Net days left; negative when overdrawn. */
  remaining: number;
};

const round = (value: number) => Number(value.toFixed(2));

/**
 * One bar per member, most days left first, so the chart answers "who still
 * has leave to take" without the reader scanning every label.
 */
export function buildMemberRemaining(
  members: ReportScopeMember[],
  summary: ReportSummaryRow[],
  leaveType: VacationKind
): MemberRemaining[] {
  const unique = new Map<string, ReportScopeMember>();
  for (const member of members) {
    if (!unique.has(member.id)) unique.set(member.id, member);
  }

  return Array.from(unique.values())
    .map((member) => {
      const rows = summary.filter(
        (row) => row.userId === member.id && row.vacationType === leaveType
      );
      const sum = (pick: (row: ReportSummaryRow) => number) =>
        round(rows.reduce((total, row) => total + pick(row), 0));

      const carriedOver = sum((row) => row.carriedOverDays);
      const yearQuota = sum((row) => row.yearQuota);
      const usedToDate = sum((row) => row.usedToDate);
      const planned = sum((row) => row.plannedRemaining);
      const used = round(usedToDate + planned);

      const carriedOverLeft = round(Math.max(0, carriedOver - used));
      const intoYearQuota = Math.max(0, used - carriedOver);
      const yearLeft = round(Math.max(0, yearQuota - intoYearQuota));
      const overdraft = round(-Math.max(0, intoYearQuota - yearQuota));

      return {
        member,
        carriedOver,
        yearQuota,
        usedToDate,
        planned,
        used,
        pending: sum((row) => row.pending),
        carriedOverLeft,
        yearLeft,
        overdraft,
        remaining: round(carriedOverLeft + yearLeft + overdraft),
      };
    })
    .sort((a, b) => b.remaining - a.remaining || a.member.name.localeCompare(b.member.name));
}

export type MemberCard = {
  member: ReportScopeMember;
  vacationType: VacationKind;
  /** Granted allowance plus carry-over. */
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
  summary: ReportSummaryRow[],
  types?: VacationKind[]
): MemberCard[] {
  const wanted = types && types.length > 0 ? new Set(types) : null;
  const seen = new Map<string, ReportScopeMember>();
  for (const member of members) {
    if (!seen.has(member.id)) seen.set(member.id, member);
  }

  const leaveTypes = activeLeaveTypes(summary, types);

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
