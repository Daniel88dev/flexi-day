export type Iso = string;
export type IsoDate = string;
export type IsoTime = string;
export type UUID = string;

export enum VacationKind {
  Vacation = "VACATION",
  HomeOffice = "HOME_OFFICE",
  Sick = "SICK",
  BankHoliday = "BANK_HOLIDAY",
  NonPaidLeave = "NON_PAID_LEAVE",
  PaidTimeOff = "PAID_TIME_OFF",
  SickLeave = "SICK_LEAVE",
  StudyLeave = "STUDY_LEAVE",
  Other = "OTHER",
}

export const VACATION_KIND_LABELS: Record<VacationKind, string> = {
  [VacationKind.Vacation]: "Vacation",
  [VacationKind.HomeOffice]: "Home Office",
  [VacationKind.Sick]: "Sick",
  [VacationKind.BankHoliday]: "Bank Holiday",
  [VacationKind.NonPaidLeave]: "Non-Paid Leave",
  [VacationKind.PaidTimeOff]: "Paid Time Off",
  [VacationKind.SickLeave]: "Sick Leave",
  [VacationKind.StudyLeave]: "Study Leave",
  [VacationKind.Other]: "Other",
};

export const VACATION_KIND_COLORS: Record<VacationKind, string> = {
  [VacationKind.Vacation]: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  [VacationKind.HomeOffice]: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  [VacationKind.Sick]: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  [VacationKind.SickLeave]: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  [VacationKind.BankHoliday]:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  [VacationKind.NonPaidLeave]:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  [VacationKind.PaidTimeOff]: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  [VacationKind.StudyLeave]:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  [VacationKind.Other]: "bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-300",
};

export type UserSummary = {
  id: UUID;
  name: string;
  initials: string;
  avatarColor: string; // hsl(...)
};

export type Vacation = {
  id: UUID;
  userId: UUID;
  groupId: UUID;
  requestedDay: IsoDate;
  startTime: IsoTime | null;
  endTime: IsoTime | null;
  vacationType: VacationKind;
  note: string | null;
  rejectionReason: string | null;
  approvedAt: Iso | null;
  approvedBy: UUID | null;
  rejectedAt: Iso | null;
  rejectedBy: UUID | null;
  deletedAt: Iso | null;
  createdAt: Iso;
  updatedAt: Iso;
};

export type VacationListItem = Vacation & {
  user: UserSummary;
};

export type VacationStatus = "pending" | "approved" | "rejected";

export function vacationStatus(v: Vacation): VacationStatus {
  if (v.approvedAt) return "approved";
  if (v.rejectedAt) return "rejected";
  return "pending";
}

export type Group = {
  id: UUID;
  groupName: string;
  defaultVacationDays: number;
  defaultHomeOfficeDays: number;
  managerUserId: UUID;
  mainApprovalUser: UUID | null;
  tempApprovalUser: UUID | null;
  deletedAt: Iso | null;
  createdAt: Iso;
  updatedAt: Iso;
};

export type GroupUser = {
  id: UUID;
  groupId: UUID;
  userId: UUID;
  viewAccess: boolean;
  adminAccess: boolean;
  controlledUser: boolean;
  deletedAt: Iso | null;
  createdAt: Iso;
  updatedAt: Iso;
};

export type UserYearQuota = {
  id: UUID;
  userId: UUID;
  groupId: UUID;
  relatedYear: string;
  vacationDays: number;
  homeOfficeDays: number;
  createdAt: Iso;
  updatedAt: Iso;
};

export type CreateVacationInput = {
  groupId: UUID;
  from: IsoDate;
  to: IsoDate;
  vacationType?: VacationKind;
  startTime?: IsoTime | null;
  endTime?: IsoTime | null;
  note?: string | null;
};

export type CreateGroupInput = {
  groupName: string;
  defaultVacation?: number;
  defaultHomeOffice?: number;
  mainApprovalUser?: UUID;
};

export type UpdateGroupUsersInput = {
  groupId: UUID;
  data: Array<{
    userId: UUID;
    viewAccess: boolean;
    adminAccess: boolean;
    controlledUser: boolean;
  }>;
};

export type PendingApproval = {
  vacationIds: UUID[];
  user: UserSummary;
  groupId: UUID;
  groupName: string;
  vacationType: VacationKind;
  from: IsoDate;
  to: IsoDate;
  businessDays: number;
  note: string | null;
  submittedAt: Iso;
};

export type DashboardSummary = {
  pendingApprovalsCount: number;
  outTodayCount: number;
  workingTodayCount: number;
  upcomingNext14DaysCount: number;
  teamSize: number;
};

export type BalanceBucket = {
  type: VacationKind;
  allocated: number;
  used: number;
  pending: number;
};

export type BalanceSummary = {
  year: string;
  buckets: BalanceBucket[];
};

export type BankHoliday = {
  date: IsoDate;
  name: string;
  country: string;
  region?: string;
};

export type NotificationKind =
  | "approval_requested"
  | "approval_decided"
  | "calendar_conflict"
  | "balance_low";

export type AppNotification = {
  id: UUID;
  type: NotificationKind;
  title: string;
  body: string;
  href: string | null;
  readAt: Iso | null;
  createdAt: Iso;
};

export type SignUpWithTeamInput = {
  name: string;
  email: string;
  password: string;
  teamName: string;
};

export type SignUpWithTeamResponse = {
  user: { id: UUID; name: string; email: string };
  token: string | null;
  group: Group;
};
