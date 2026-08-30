export type Iso = string;
export type IsoDate = string;
export type IsoTime = string;
export type UUID = string;

export enum CalendarRecordType {
  Vacation = "VACATION",
  HomeOffice = "HOME_OFFICE",
  Sick = "SICK",
  BankHoliday = "BANK_HOLIDAY",
  NonPaidLeave = "NON_PAID_LEAVE",
  PaidTimeOff = "PAID_TIME_OFF",
  SickDay = "SICK_DAY",
  StudyLeave = "STUDY_LEAVE",
  Other = "OTHER",
}

/** The everyday types, one click away in the request and edit forms. */
export const PRIMARY_CALENDAR_RECORD_TYPES: readonly CalendarRecordType[] = [
  CalendarRecordType.Vacation,
  CalendarRecordType.HomeOffice,
  CalendarRecordType.Sick,
];

/**
 * The rarer requestable types, behind the forms' "Others" option. SickDay is
 * deliberately absent until the sick-day benefit ships (issue #88), so the
 * type never appears and then vanishes.
 */
export const OTHER_CALENDAR_RECORD_TYPES: readonly CalendarRecordType[] = [
  CalendarRecordType.PaidTimeOff,
  CalendarRecordType.NonPaidLeave,
  CalendarRecordType.StudyLeave,
  CalendarRecordType.Other,
];

/** Every type a member can pick in the request and edit forms. */
export const REQUESTABLE_CALENDAR_RECORD_TYPES: readonly CalendarRecordType[] = [
  ...PRIMARY_CALENDAR_RECORD_TYPES,
  ...OTHER_CALENDAR_RECORD_TYPES,
];

export const CALENDAR_RECORD_TYPE_COLORS: Record<CalendarRecordType, string> = {
  [CalendarRecordType.Vacation]: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  [CalendarRecordType.HomeOffice]:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  [CalendarRecordType.Sick]: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  [CalendarRecordType.SickDay]: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  [CalendarRecordType.BankHoliday]:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  [CalendarRecordType.NonPaidLeave]:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  [CalendarRecordType.PaidTimeOff]:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  [CalendarRecordType.StudyLeave]:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  [CalendarRecordType.Other]:
    "bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-300",
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
  vacationType: CalendarRecordType;
  /** Counts 0.5 against the allowance instead of a full day. */
  halfDay: boolean;
  note: string | null;
  rejectionReason: string | null;
  approvedAt: Iso | null;
  approvedBy: UUID | null;
  rejectedAt: Iso | null;
  rejectedBy: UUID | null;
  deletedAt: Iso | null;
  /** Who cancelled the row; null on rows cancelled before the column existed. */
  deletedByUserId: UUID | null;
  /** Differs from `userId` when an admin booked on the member's behalf. */
  createdByUserId: UUID | null;
  createdAt: Iso;
  updatedAt: Iso;
};

/**
 * `mirroredFromGroupId` is set only on group-scoped responses, and only for
 * records that belong to another group and are merely projected into the one
 * being viewed (see group mirroring). Those are read-only here: they are
 * approved, counted and reported in their source group alone.
 */
export type VacationListItem = Vacation & {
  user: UserSummary;
  mirroredFromGroupId?: UUID | null;
  mirroredFromGroupName?: string | null;
  /** The backend's verdict on whether the caller may decide on this request. */
  canApprove: boolean;
};

export type VacationEventKind =
  "CREATED" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMMENT" | "UPDATED";

export type VacationEvent = {
  id: UUID;
  vacationId: UUID;
  eventType: VacationEventKind;
  /** Null when the actor's account has since been removed. */
  actor: UserSummary | null;
  reason: string | null;
  createdAt: Iso;
};

/**
 * One request with its audit trail and what the current user may do with it.
 * `canApprove` / `canCancel` come from the backend so the UI never offers an
 * action the API would refuse.
 */
export type VacationDetail = VacationListItem & {
  groupName: string;
  approvedByUser: UserSummary | null;
  rejectedByUser: UserSummary | null;
  createdByUser: UserSummary | null;
  deletedByUser: UserSummary | null;
  canApprove: boolean;
  canCancel: boolean;
  /** Admin-only in-place edit of per-day fields. */
  canEdit: boolean;
  // Contiguous same-type run this request covers: span + every day-row id in it.
  rangeStart: IsoDate;
  rangeEnd: IsoDate;
  vacationIds: UUID[];
  history: VacationEvent[];
};

export type VacationStatus = "pending" | "approved" | "rejected" | "cancelled";

export function vacationStatus(v: Vacation): VacationStatus {
  // Cancellation wins: an approved-then-cancelled row still carries approvedAt.
  if (v.deletedAt) return "cancelled";
  if (v.approvedAt) return "approved";
  if (v.rejectedAt) return "rejected";
  return "pending";
}

/**
 * The organization a group belongs to, as it rides along with the group. Plan
 * and status only — no billing address, renewal date or amounts, which stay on
 * the billing endpoint and are owner-only.
 */
export type GroupOrganization = {
  id: UUID;
  name: string;
  plan: "FREE" | "PRO" | "ENTERPRISE" | "CUSTOM";
  status: "active" | "trialing" | "past_due" | "paused" | "canceled" | null;
  /** False on Free, and once a lapsed plan's grace has run out. */
  active: boolean;
  /**
   * Sick day toggle AND a paid plan — false while the benefit is dormant.
   * Optional because the repos deploy independently; absent means not offered.
   */
  sickDayBenefitActive?: boolean;
};

/** Whether a group's organization offers Sick day right now; false when unknown. */
export function sickDayBenefitActive(
  group: { organization?: GroupOrganization | null } | null | undefined
): boolean {
  return group?.organization?.sickDayBenefitActive === true;
}

export type Group = {
  id: UUID;
  /** Billing owner. Plan limits only apply when this is the viewer's own org. */
  organizationId: UUID;
  organization: GroupOrganization | null;
  groupName: string;
  defaultVacationDays: number;
  defaultHomeOfficeDays: number;
  /** Starting Sick day allowance; only meaningful while the benefit is active. */
  defaultSickDays?: number;
  /** Weekdays counted as working days, as JS `Date.getDay()` numbers (0=Sun … 6=Sat). */
  workingDays: number[];
  /** ISO 3166-1 alpha-2 country whose public holidays show on the dashboard; null = off. */
  holidayCountry: string | null;
  managerUserId: UUID;
  mainApprovalUser: UUID | null;
  tempApprovalUser: UUID | null;
  deletedAt: Iso | null;
  createdAt: Iso;
  updatedAt: Iso;
};

/**
 * A group as the list endpoint returns it: with headcount and the caller's own
 * flags. Both fields are optional because the repos deploy independently — a
 * frontend running against a backend without them must degrade, not crash.
 */
export type GroupListItem = Group & {
  memberCount?: number;
  membership?: {
    adminAccess: boolean;
    approverAccess: boolean;
  };
};

/** What the caller may actually do with a group, as the backend will enforce it. */
export type GroupAccess = {
  canView: boolean;
  canAdmin: boolean;
  /** Authority came from administering the organization, not from a membership. */
  viaOrgAdmin: boolean;
  isMember: boolean;
};

export type GroupDetail = Group & { access: GroupAccess };

export type GroupUser = {
  id: UUID;
  groupId: UUID;
  userId: UUID;
  viewAccess: boolean;
  /** Manages the group — members, quotas, invites, mirroring. Never approves. */
  adminAccess: boolean;
  /** Decides on the group's leave. Manages nothing. */
  approverAccess: boolean;
  controlledUser: boolean;
  deletedAt: Iso | null;
  createdAt: Iso;
  updatedAt: Iso;
};

/** A membership row as the members endpoint returns it: with the member's identity. */
export type GroupUserListItem = GroupUser & {
  user: UserSummary;
  email: string;
};

export type UserYearQuota = {
  id: UUID;
  userId: UUID;
  groupId: UUID;
  relatedYear: string;
  vacationDays: number;
  homeOfficeDays: number;
  /** Sick day benefit allowance; never carried over. */
  sickDays?: number;
  /** Unused vacation days rolled forward from the previous year. */
  carriedOverDays: number;
  createdAt: Iso;
  updatedAt: Iso;
};

export type CreateVacationInput = {
  groupId: UUID;
  /** Book on behalf of this member (group/org admins only). */
  userId?: UUID;
  from: IsoDate;
  to: IsoDate;
  vacationType?: CalendarRecordType;
  startTime?: IsoTime | null;
  endTime?: IsoTime | null;
  halfDay?: boolean;
  note?: string | null;
  /** Create already approved; only valid together with `userId`. */
  autoApprove?: boolean;
};

/** Admin edit of one member's day rows; only per-day fields, never dates. */
export type UpdateVacationInput = {
  ids: UUID[];
  vacationType?: CalendarRecordType;
  startTime?: IsoTime | null;
  endTime?: IsoTime | null;
  halfDay?: boolean;
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
    approverAccess: boolean;
    controlledUser: boolean;
  }>;
};

export type PendingApproval = {
  vacationIds: UUID[];
  user: UserSummary;
  groupId: UUID;
  groupName: string;
  vacationType: CalendarRecordType;
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
  type: CalendarRecordType;
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

export type HolidayCountry = {
  code: string;
  name: string;
};

export type NotificationKind =
  "approval_requested" | "approval_decided" | "calendar_conflict" | "balance_low";

export type AppNotification = {
  id: UUID;
  type: NotificationKind;
  title: string;
  body: string;
  href: string | null;
  readAt: Iso | null;
  createdAt: Iso;
};

export type SetUserQuotaInput = {
  groupId: UUID;
  userId: UUID;
  year: number;
  vacationDays: number;
  homeOfficeDays: number;
  /** Omitted (not zero) when the benefit is hidden, so saves never wipe a stored allowance. */
  sickDays?: number;
  carriedOverDays?: number;
};

export type CarryOverSuggestion = {
  previousYear: number;
  allocated: number;
  used: number;
  suggestion: number;
};

export type UpdateGroupQuotasInput = {
  groupId: UUID;
  defaultVacationDays: number;
  defaultHomeOfficeDays: number;
  /** Omitted (not zero) when the benefit is hidden, so saves never wipe a stored default. */
  defaultSickDays?: number;
};

export type UpdateGroupWorkingDaysInput = {
  groupId: UUID;
  workingDays: number[];
};

export type UpdateGroupHolidayCountryInput = {
  groupId: UUID;
  holidayCountry: string | null;
};

/** Whose leave the dashboard calendar shows by default. */
export type DashboardScope = "MINE" | "GROUP";

export type UserSettings = {
  emailNotifications: boolean;
  dashboardScope: DashboardScope;
  dashboardGroupId: UUID | null;
};

/** The settings screen saves one card at a time; the API merges the patch. */
export type UpdateUserSettingsInput = Partial<UserSettings>;

/** An invite that can still be redeemed. `code` is a secret — admin-only. */
export type GroupInvite = {
  id: UUID;
  groupId: UUID;
  code: string;
  email: string | null;
  invitedByUserId: UUID | null;
  invitedByName: string | null;
  usedAt: Iso | null;
  revokedAt: Iso | null;
  expiresAt: Iso;
  createdAt: Iso;
  updatedAt: Iso;
};

export type CreateGroupInviteInput = {
  groupId: UUID;
  email: string;
};

export type CreateGroupInviteResponse = {
  invite: GroupInvite;
  /** False when the code was created but the email could not be sent. */
  emailDelivered: boolean;
};

/**
 * A group a member's records could be projected from, and whether they
 * currently are. `manageable` is false for a source the viewer does not
 * administer: shown for completeness, not theirs to change.
 */
export type MirrorCandidate = {
  groupId: UUID;
  groupName: string;
  mirrored: boolean;
  manageable: boolean;
};

/** One member of the group being configured, with their mirror sources. */
export type MirrorMember = {
  userId: UUID;
  user: UserSummary;
  email: string;
  candidates: MirrorCandidate[];
};

/**
 * Mirroring is configured by a group's admins. `canManage` is false for
 * everyone else, and `members` then holds only the caller's own mirrors.
 */
export type GroupMirrorsResponse = {
  groupId: UUID;
  canManage: boolean;
  members: MirrorMember[];
};

export type SetGroupMirrorsInput = {
  groupId: UUID;
  userId: UUID;
  sourceGroupIds: UUID[];
};

export type GroupMirror = {
  id: UUID;
  userId: UUID;
  sourceGroupId: UUID;
  targetGroupId: UUID;
  sourceGroupName: string;
  deletedAt: Iso | null;
  createdAt: Iso;
  updatedAt: Iso;
};
