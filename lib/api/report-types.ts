import type { Iso, IsoDate, UserSummary, UUID, CalendarRecordType } from "./types";

/**
 * How much of a group the caller may report on. `all` means every member
 * (view access, admin access, or managing the group); `self` is the fallback
 * a plain member gets for their own rows.
 */
export type ReportAccess = "all" | "self";

export type ReportScopeGroup = {
  groupId: UUID;
  groupName: string;
  access: ReportAccess;
  canEditQuotas: boolean;
};

export type ReportScopeMember = UserSummary & {
  groupId: UUID;
};

export type ReportScope = {
  groups: ReportScopeGroup[];
  members: ReportScopeMember[];
  years: number[];
};

export type MonthlyUsage = {
  userId: UUID;
  groupId: UUID;
  /** 1-12. */
  month: number;
  vacationType: CalendarRecordType;
  used: number;
  pending: number;
};

/** One allowance line: what was granted against what has been taken. */
export type ReportSummaryRow = {
  userId: UUID;
  groupId: UUID;
  vacationType: CalendarRecordType;
  carriedOverDays: number;
  yearQuota: number;
  usedToDate: number;
  plannedRemaining: number;
  pending: number;
  remaining: number;
};

export type ReportOverview = {
  year: number;
  groups: ReportScopeGroup[];
  members: ReportScopeMember[];
  monthly: MonthlyUsage[];
  summary: ReportSummaryRow[];
};

export type ReportBooking = {
  userId: UUID;
  userName: string;
  groupId: UUID;
  groupName: string;
  vacationType: CalendarRecordType;
  from: IsoDate;
  to: IsoDate;
  days: number;
  year: number;
  month: number;
  status: "approved" | "pending" | "rejected";
  note: string | null;
};

export type MemberChange = {
  id: UUID;
  groupId: UUID;
  changeType: string;
  changeDetail: string;
  /** Null when the admin who made the change has since been removed. */
  actor: UserSummary | null;
  createdAt: Iso;
};

export type ReportQuotaRow = {
  userId: UUID;
  groupId: UUID;
  vacationDays: number;
  homeOfficeDays: number;
  /** Sick day benefit allowance; absent from a backend predating the benefit. */
  sickDays?: number;
  carriedOverDays: number;
};

export type MemberReport = {
  year: number;
  member: UserSummary;
  groups: ReportScopeGroup[];
  quotas: ReportQuotaRow[];
  summary: ReportSummaryRow[];
  monthly: MonthlyUsage[];
  bookings: ReportBooking[];
  changes: MemberChange[];
};

/** Chart window: the trailing 12 months, or one whole calendar year. */
export type ReportPeriod = "rolling" | number;

export type ReportFilters = {
  year: number;
  groupIds?: UUID[];
  userIds?: UUID[];
  types?: CalendarRecordType[];
};
