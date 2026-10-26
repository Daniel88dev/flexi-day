"use client";

import {
  queryOptions,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiError, errorCode } from "./client";
import {
  acceptDirectoryAgreement,
  enableDirectory,
  getDirectoryProfile,
  getEndPreview,
  getProfileHistory,
  updateDirectoryProfile,
  type DirectoryProfilePatch,
  getDirectoryState,
  listDirectoryOrganizations,
  listDirectoryPeople,
  listFormerDirectoryPeople,
  getDirectoryRoles,
  getPermissionHistory,
  getPermissionTable,
  setDirectoryRoles,
  updatePermissionCell,
  type DirectoryAudience,
  type DirectoryRoleName,
  type PermissionRow,
  type PermissionValue,
  getProfilePhotoUpload,
  removeProfilePhoto,
  startProfilePhotoUpload,
  type ProfilePhotoUpload,
} from "./directory";
import { waitForPhotoUpload } from "@/lib/directory/profile-photo";
import {
  approveVacation,
  approveVacations,
  cancelVacations,
  commentVacation,
  createVacation,
  getVacation,
  listVacationCalendar,
  listVacations,
  rejectVacation,
  rejectVacations,
  updateVacation,
  type ListVacationCalendarParams,
  type ListVacationsParams,
} from "./vacations";
import {
  createGroup,
  getGroup,
  listGroups,
  updateGroupHolidayCountry,
  updateGroupManager,
  updateGroupQuotas,
  updateGroupWorkingDays,
} from "./groups";
import {
  getAttendanceSettings,
  updateAttendanceSettings,
  type UpdateAttendanceSettingsInput,
} from "./attendance-settings";
import {
  clockIn,
  clockOut,
  correctBreak,
  correctSession,
  endBreak,
  addBreak,
  markSessionChecked,
  enterSession,
  getAttendanceDay,
  getAttendanceMonth,
  getAttendanceState,
  getSessionEvents,
  getTeamAttendance,
  removeBreak,
  removeSession,
  type AttendanceCorrection,
  type AttendanceDayParams,
  type AttendanceBreakSpan,
  type AttendanceEntry,
  type TeamAttendanceParams,
  startBreak,
  type AttendanceSession,
  type AttendanceSessionEnd,
} from "./attendance";
import {
  endEmployment,
  eraseEmployment,
  listEmployments,
  updateEmploymentRequiredMinutes,
} from "./employment";
import {
  listOwnExportOrganizations,
  listRequestedExports,
  getOrganizationExport,
  requestOrganizationExport,
  requestOwnPersonExport,
  requestPersonExport,
  type PersonExport,
} from "./person-export";
import { captureSessionLocation } from "@/lib/attendance/geolocation";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  addOrganizationAdmin,
  getOrganization,
  listOrganizationCandidates,
  listOrganizations,
  removeOrganizationAdmin,
  updateOrganization,
} from "./organization";
import {
  createGroupInvite,
  joinGroupByCode,
  joinGroupByLink,
  listGroupInvites,
  listGroupUsers,
  previewInvite,
  removeGroupUser,
  revokeGroupInvite,
  signUpWithInvite,
  updateGroupUsers,
} from "./group-users";
import {
  changePlan,
  createCheckout,
  createPortalSession,
  getBillingOverview,
  updateExtraSlots,
  type BillingCycle,
  type CheckoutInput,
  type PaidPlan,
} from "./billing";
import { getGroupMirrors, setGroupMirrors } from "./group-mirrors";
import { createAttachment, deleteAttachment } from "./attachments";
import { UploadError, uploadToTarget } from "./attachment-upload";
import {
  PROCESSING_POLL_MS,
  declaredContentType,
  hasProcessingAttachment,
} from "@/lib/attachments/rules";
import { getCarryOverSuggestion, listQuotas, setUserQuota, type ListQuotasParams } from "./quotas";
import {
  getMemberReport,
  getReportOverview,
  getReportScope,
  reportFiltersToQuery,
} from "./reports";
import type { ReportFilters } from "./report-types";
import { getMySettings, updateMySettings } from "./settings";
import {
  BIRTHDAY_SHARE_PLAN_REQUIRED,
  deleteMyBirthday,
  getMyBirthday,
  putMyBirthday,
  type MyBirthday,
} from "./birthday";
import { listBirthdays, type ListBirthdaysParams } from "./birthdays";
import {
  createGroupEvent,
  deleteGroupEvent,
  groupEventImpact,
  listGroupEventGroups,
  listGroupEvents,
  updateGroupEvent,
  type CreateGroupEventInput,
  type GroupEventDeleteRequest,
  type GroupEventEditRequest,
  type ListGroupEventsParams,
} from "./group-events";
import { deleteMyAccount, getAccountDeletionStatus } from "./account-deletion";
import {
  getSupportGroup,
  getSupportOrganization,
  opaqueSearchKey,
  searchSupportOrganizations,
} from "./support";
import { listMyApprovals, listMyPendingRequests } from "./approvals";
import { getDashboardSummary } from "./dashboard";
import { getMyBalances } from "./balances";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
  type ListNotificationsParams,
} from "./notifications";
import {
  listBankHolidayCountries,
  listBankHolidays,
  type ListBankHolidaysParams,
} from "./bank-holidays";
import {
  createCalendarSync,
  deleteCalendarSync,
  listCalendarSyncs,
  regenerateCalendarSyncToken,
  updateCalendarSync,
  type CalendarSyncInput,
} from "./calendar-sync";
import {
  disconnectCalendar,
  listConnections,
  removeCalendarTarget,
  setCalendarTarget,
  startConnection,
  syncCalendarNow,
  type CalendarProviderSlug,
} from "./calendar-connections";
import { browserTimezone } from "@/lib/attendance/timezones";
import type {
  CreateGroupInput,
  CreateGroupInviteInput,
  CreateVacationInput,
  InviteSignUpInput,
  IsoDate,
  SetGroupMirrorsInput,
  SetUserQuotaInput,
  UpdateGroupHolidayCountryInput,
  UpdateGroupManagerInput,
  UpdateGroupQuotasInput,
  UpdateGroupUsersInput,
  UpdateGroupWorkingDaysInput,
  UpdateUserSettingsInput,
  UpdateVacationInput,
  UUID,
} from "./types";

export const qk = {
  vacations: (
    year: number,
    month: number,
    groupId?: string | null,
    includeCancelled?: boolean,
    wholeRequests?: boolean
  ) =>
    [
      "vacations",
      year,
      month,
      groupId ?? "mine",
      includeCancelled ?? false,
      wholeRequests ?? false,
    ] as const,
  vacationRange: (p: VacationRangeParams) =>
    [
      "vacations",
      "range",
      p.from,
      p.to,
      p.groupId ?? "mine",
      p.includeCancelled ?? false,
      p.wholeRequests ?? false,
    ] as const,
  // Under the "vacations" prefix so every vacation invalidation refreshes it too.
  vacationCalendar: (year: number, month: number, groupId?: string | null) =>
    ["vacations", "calendar", year, month, groupId ?? "mine"] as const,
  vacation: (id: string) => ["vacation", id] as const,
  groups: () => ["groups"] as const,
  group: (groupId: string) => ["group", groupId] as const,
  groupUsers: (groupId: string) => ["group-users", groupId] as const,
  groupInvites: (groupId: string) => ["group-invites", groupId] as const,
  // Hashed: the token is the invite link secret, and query keys reach Sentry.
  invitePreview: (token: string) => ["invite-preview", opaqueSearchKey(token)] as const,
  groupMirrors: (groupId: string) => ["group-mirrors", groupId] as const,
  quotas: (groupId: string, year: number, userId?: string) =>
    ["quotas", groupId, year, userId ?? "all"] as const,
  myApprovals: () => ["my-approvals"] as const,
  myPendingRequests: () => ["my-pending-requests"] as const,
  dashboardSummary: (today: IsoDate) => ["dashboard-summary", today] as const,
  myBalances: (year: number) => ["my-balances", year] as const,
  notifications: (unreadOnly: boolean) => ["notifications", unreadOnly] as const,
  bankHolidays: (year: number, country: string, region?: string) =>
    ["bank-holidays", year, country, region ?? "*"] as const,
  bankHolidayCountries: () => ["bank-holiday-countries"] as const,
  calendarSyncs: () => ["calendar-syncs"] as const,
  calendarConnections: () => ["calendar-connections"] as const,
  mySettings: () => ["my-settings"] as const,
  myBirthday: () => ["my-birthday"] as const,
  birthdays: (year: number, month: number, groupId?: string | null) =>
    ["birthdays", year, month, groupId ?? "mine"] as const,
  groupEvents: (year: number, month: number, groupId?: string | null) =>
    ["group-events", year, month, groupId ?? "mine"] as const,
  groupEventGroups: () => ["group-events", "groups"] as const,
  groupEventImpact: (id: string, request: GroupEventEditRequest) =>
    [
      "group-events",
      "impact",
      id,
      request.scope ?? null,
      request.occurrenceDate ?? null,
      JSON.stringify(request.changes),
    ] as const,
  accountDeletion: () => ["account-deletion"] as const,
  reportScope: () => ["report-scope"] as const,
  // Keyed on the serialised filters so every filter combination caches on its
  // own instead of thrashing a single entry.
  reportOverview: (filters: ReportFilters) =>
    ["report-overview", reportFiltersToQuery(filters)] as const,
  memberReport: (userId: string, year: number) => ["member-report", userId, year] as const,
  carryOverSuggestion: (groupId: string, userId: string, year: number) =>
    ["carryover-suggestion", groupId, userId, year] as const,
  subscription: () => ["subscription"] as const,
  organizations: () => ["organizations"] as const,
  organization: (organizationId?: string | null) =>
    ["organization", organizationId ?? "own"] as const,
  organizationCandidates: (organizationId?: string | null) =>
    ["organization-candidates", organizationId ?? "own"] as const,
  attendanceSettings: (organizationId?: string | null) =>
    ["attendance-settings", organizationId ?? "own"] as const,
  attendanceState: (organizationId?: string | null) =>
    ["attendance-state", organizationId ?? "own"] as const,
  attendanceMonth: (year: number, month: number, organizationId?: string | null) =>
    ["attendance-month", year, month, organizationId ?? "own"] as const,
  attendanceDay: (params: AttendanceDayParams) =>
    ["attendance-day", params.organizationId, params.businessDate, params.userId ?? "own"] as const,
  attendanceEvents: (sessionId: string) => ["attendance-events", sessionId] as const,
  employments: (organizationId?: string | null) =>
    ["employments", organizationId ?? "own"] as const,
  requestedExports: (organizationId?: string | null) =>
    ["person-exports", "requested", organizationId ?? "none"] as const,
  ownExports: () => ["person-exports", "own"] as const,
  directoryState: (organizationId?: string | null) =>
    ["directory", "state", organizationId ?? "none"] as const,
  directoryOrganizations: () => ["directory", "organizations"] as const,
  directoryPeople: (organizationId: string) => ["directory", "people", organizationId] as const,
  directoryFormer: (organizationId: string) => ["directory", "former", organizationId] as const,
  directoryProfile: (organizationId: string, employmentId: string) =>
    ["directory", "profile", organizationId, employmentId] as const,
  directoryProfileHistory: (organizationId: string, employmentId: string) =>
    ["directory", "history", organizationId, employmentId] as const,
  directoryEndPreview: (organizationId: string, employmentId: string) =>
    ["directory", "end-preview", organizationId, employmentId] as const,
  directoryPermissions: (organizationId: string) =>
    ["directory", "permissions", organizationId] as const,
  directoryPermissionHistory: (organizationId: string) =>
    ["directory", "permissionHistory", organizationId] as const,
  directoryRoles: (organizationId: string) => ["directory", "roles", organizationId] as const,
  organizationExport: (organizationId?: string | null) =>
    ["person-exports", "organization", organizationId ?? "none"] as const,
  attendanceTeam: (params: TeamAttendanceParams) =>
    [
      "attendance-team",
      params.organizationId,
      params.from,
      params.to,
      params.groupId ?? "all",
    ] as const,
  // Hashed: query keys reach Sentry on failures and this one is free text.
  supportOrganizations: (query: string) =>
    ["support-organizations", opaqueSearchKey(query)] as const,
  supportOrganization: (organizationId: string) =>
    ["support-organization", organizationId] as const,
  supportGroup: (groupId: string) => ["support-group", groupId] as const,
};

function invalidateVacationDependants(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["vacations"] });
  // The open detail dialog shows a status and a history that a decision or a
  // cancellation has just changed.
  qc.invalidateQueries({ queryKey: ["vacation"] });
  qc.invalidateQueries({ queryKey: qk.myApprovals() });
  qc.invalidateQueries({ queryKey: qk.myPendingRequests() });
  qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
  qc.invalidateQueries({ queryKey: ["my-balances"] });
}

export function useVacations(
  params: ListVacationsParams & Required<Pick<ListVacationsParams, "year" | "month">>
) {
  return useQuery({
    queryKey: qk.vacations(
      params.year,
      params.month,
      params.groupId,
      params.includeCancelled,
      params.wholeRequests
    ),
    queryFn: () => listVacations(params),
  });
}

type VacationRangeParams = Extract<ListVacationsParams, { from: string }>;

export function useVacationRange(params: VacationRangeParams) {
  return useQuery({
    queryKey: qk.vacationRange(params),
    queryFn: () => listVacations(params),
  });
}

export function useVacationCalendar(params: ListVacationCalendarParams) {
  return useQuery({
    queryKey: qk.vacationCalendar(params.year, params.month, params.groupId),
    queryFn: () => listVacationCalendar(params),
  });
}

export function useBirthdays(params: ListBirthdaysParams) {
  return useQuery({
    queryKey: qk.birthdays(params.year, params.month, params.groupId),
    queryFn: () => listBirthdays(params),
  });
}

export function useGroupEvents(params: ListGroupEventsParams) {
  return useQuery({
    queryKey: qk.groupEvents(params.year, params.month, params.groupId),
    queryFn: () => listGroupEvents(params),
  });
}

export function useGroupEventGroups() {
  return useQuery({ queryKey: qk.groupEventGroups(), queryFn: listGroupEventGroups });
}

/** Every group event write ends here: each month's calendar and the create rights refetch. */
export function invalidateGroupEventDependants(qc: ReturnType<typeof useQueryClient>) {
  return qc.invalidateQueries({ queryKey: ["group-events"] });
}

export function useCreateGroupEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGroupEventInput) => createGroupEvent(input),
    onSuccess: () => invalidateGroupEventDependants(qc),
  });
}

export function useUpdateGroupEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: GroupEventEditRequest }) =>
      updateGroupEvent(id, request),
    onSuccess: () => invalidateGroupEventDependants(qc),
  });
}

export function useDeleteGroupEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: GroupEventDeleteRequest }) =>
      deleteGroupEvent(id, request),
    onSuccess: () => invalidateGroupEventDependants(qc),
  });
}

/** How many one-off changes an edit would drop, asked before the user confirms it. */
export function useGroupEventImpact(id: string, request: GroupEventEditRequest, enabled: boolean) {
  return useQuery({
    queryKey: qk.groupEventImpact(id, request),
    queryFn: () => groupEventImpact(id, request),
    enabled,
  });
}

export function useVacation(id: string | null | undefined) {
  return useQuery({
    queryKey: qk.vacation(id ?? ""),
    queryFn: () => getVacation(id!),
    enabled: !!id,
    // A fresh upload settles server-side after the bytes land; keep asking
    // until every row is READY or REJECTED, or has been stuck long enough to
    // count as failed.
    refetchInterval: (query) =>
      hasProcessingAttachment(query.state.data?.attachments) ? PROCESSING_POLL_MS : false,
  });
}

export function useGroups(enabled = true) {
  return useQuery({
    queryKey: qk.groups(),
    queryFn: listGroups,
    enabled,
  });
}

/**
 * One group with the caller's effective rights. Reaches groups the caller only
 * administers through their organization, which `useGroups` deliberately does
 * not — that list also drives the dashboard and the request dialog.
 */
export function useGroup(groupId: string | null | undefined) {
  return useQuery({
    queryKey: qk.group(groupId ?? ""),
    queryFn: () => getGroup(groupId!),
    enabled: !!groupId,
  });
}

export function useGroupUsers(groupId: string | null | undefined) {
  return useQuery({
    queryKey: qk.groupUsers(groupId ?? ""),
    queryFn: () => listGroupUsers(groupId!),
    enabled: !!groupId,
  });
}

export function useQuotas(
  groupId: string | null | undefined,
  params: Required<Pick<ListQuotasParams, "year">> & { userId?: string }
) {
  return useQuery({
    queryKey: qk.quotas(groupId ?? "", params.year, params.userId),
    queryFn: () => listQuotas(groupId!, params),
    enabled: !!groupId,
  });
}

export function useMyApprovals() {
  return useQuery({
    queryKey: qk.myApprovals(),
    queryFn: listMyApprovals,
  });
}

export function useMyPendingRequests() {
  return useQuery({
    queryKey: qk.myPendingRequests(),
    queryFn: listMyPendingRequests,
  });
}

export function useDashboardSummary(today: IsoDate) {
  return useQuery({
    queryKey: qk.dashboardSummary(today),
    queryFn: () => getDashboardSummary(today),
  });
}

export function useMyBalances(year: number) {
  return useQuery({
    queryKey: qk.myBalances(year),
    queryFn: () => getMyBalances(year),
  });
}

export function useNotifications(params: ListNotificationsParams = {}) {
  const unreadOnly = !!params.unreadOnly;
  return useQuery({
    queryKey: qk.notifications(unreadOnly),
    queryFn: () => listNotifications({ unreadOnly }),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useBankHolidays(params: ListBankHolidaysParams & { enabled?: boolean }) {
  const { enabled = true, year, country, region } = params;
  const effectiveYear = year ?? new Date().getFullYear();
  return useQuery({
    queryKey: qk.bankHolidays(effectiveYear, country, region),
    queryFn: () => listBankHolidays({ year: effectiveYear, country, region }),
    enabled: enabled && !!country,
  });
}

export function useBankHolidayCountries() {
  return useQuery({
    queryKey: qk.bankHolidayCountries(),
    queryFn: () => listBankHolidayCountries(),
    // The dataset is bundled with the backend; it never changes within a session.
    staleTime: Infinity,
  });
}

/** Bank holidays for several years and countries at once, merged into one flat list. */
export function useBankHolidaysMulti(years: number[], countries: string[]) {
  const unique = Array.from(new Set(countries)).sort();
  return useQueries({
    queries: Array.from(new Set(years)).flatMap((year) =>
      unique.map((country) => ({
        queryKey: qk.bankHolidays(year, country),
        queryFn: () => listBankHolidays({ year, country }),
      }))
    ),
    combine: (results) => results.flatMap((r) => r.data ?? []),
  });
}

export function useCreateVacation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVacationInput) => createVacation(input),
    onSuccess: () => invalidateVacationDependants(qc),
  });
}

export type UploadAttachmentInput = {
  requestId: string;
  file: File;
  /** Called with the row's id as soon as the backend has it, before the bytes go. */
  onRegistered?: (attachmentId: string) => void;
  onProgress?: (fraction: number) => void;
};

/**
 * Registers the file, then sends its bytes to the target the backend named.
 * Either step can fail; the detail is refetched in both cases, because a row
 * registered but never uploaded still occupies a slot until the sweep clears it.
 */
export function useUploadAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, file, onRegistered, onProgress }: UploadAttachmentInput) => {
      const { attachment, upload } = await createAttachment({
        requestId,
        fileName: file.name,
        contentType: declaredContentType(file),
        size: file.size,
      });
      onRegistered?.(attachment.id);
      try {
        await uploadToTarget(upload, file, onProgress);
      } catch (error) {
        if (error instanceof UploadError) {
          throw new UploadError(error.status, error.message, attachment.id);
        }
        throw error;
      }
      return attachment;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["vacation"] });
    },
  });
}

/**
 * The detail is refetched whatever the outcome: a 404 or 409 means someone
 * else removed the row first, and the list should show that too.
 */
export function useDeleteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAttachment(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["vacation"] });
    },
  });
}

export function useUpdateVacation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateVacationInput) => updateVacation(input),
    onSuccess: () => invalidateVacationDependants(qc),
  });
}

export function useApproveVacation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: string | { id: string; reason?: string }) =>
      typeof input === "string" ? approveVacation(input) : approveVacation(input.id, input.reason),
    onSuccess: () => invalidateVacationDependants(qc),
  });
}

export function useCommentVacation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; message: string }) =>
      commentVacation(input.id, input.message),
    onSuccess: () => invalidateVacationDependants(qc),
  });
}

export function useRejectVacation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; reason?: string }) => rejectVacation(input.id, input.reason),
    onSuccess: () => invalidateVacationDependants(qc),
  });
}

export function useApproveVacations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { ids: string[]; reason?: string }) =>
      approveVacations(input.ids, input.reason),
    onSuccess: () => invalidateVacationDependants(qc),
  });
}

export function useRejectVacations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { ids: string[]; reason?: string }) =>
      rejectVacations(input.ids, input.reason),
    onSuccess: () => invalidateVacationDependants(qc),
  });
}

export function useCancelVacations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { ids: string[]; reason?: string }) =>
      cancelVacations(input.ids, input.reason),
    onSuccess: () => invalidateVacationDependants(qc),
    // The 409 means the rows really were cancelled, just not by this request.
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) invalidateVacationDependants(qc);
    },
  });
}

export function useSetUserQuota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SetUserQuotaInput) => setUserQuota(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotas"] });
      // The report reads the same allowances, and the member detail also
      // shows the audit entry this write just created.
      qc.invalidateQueries({ queryKey: ["report-overview"] });
      qc.invalidateQueries({ queryKey: ["member-report"] });
      qc.invalidateQueries({ queryKey: ["carryover-suggestion"] });
    },
  });
}

/**
 * Enabled only once an admin opens the quota dialog — the endpoint is
 * admin-only and would 403 for anyone else.
 */
export function useCarryOverSuggestion(
  groupId: string | null | undefined,
  userId: string | null | undefined,
  year: number,
  enabled = true
) {
  return useQuery({
    queryKey: qk.carryOverSuggestion(groupId ?? "", userId ?? "", year),
    queryFn: () => getCarryOverSuggestion(groupId!, userId!, year),
    enabled: enabled && !!groupId && !!userId,
  });
}

export function useReportScope() {
  return useQuery({
    queryKey: qk.reportScope(),
    queryFn: getReportScope,
  });
}

export function reportOverviewQuery(filters: ReportFilters) {
  return queryOptions({
    queryKey: qk.reportOverview(filters),
    queryFn: () => getReportOverview(filters),
  });
}

export function useReportOverview(filters: ReportFilters) {
  return useQuery(reportOverviewQuery(filters));
}

export function memberReportQuery(userId: string | null | undefined, year: number) {
  return queryOptions({
    queryKey: qk.memberReport(userId ?? "", year),
    queryFn: () => getMemberReport(userId!, year),
    enabled: !!userId,
  });
}

export function useMemberReport(userId: string | null | undefined, year: number) {
  return useQuery(memberReportQuery(userId, year));
}

// Both also invalidate the single-group query: the detail screen reads the
// group from there now, so invalidating only the list would leave the header
// and the quota fallbacks showing the old defaults until a reload.
export function useUpdateGroupQuotas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateGroupQuotasInput) => updateGroupQuotas(input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: qk.groups() });
      qc.invalidateQueries({ queryKey: qk.group(vars.groupId) });
    },
  });
}

export function useUpdateGroupWorkingDays() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateGroupWorkingDaysInput) => updateGroupWorkingDays(input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: qk.groups() });
      qc.invalidateQueries({ queryKey: qk.group(vars.groupId) });
    },
  });
}

export function useUpdateGroupHolidayCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateGroupHolidayCountryInput) => updateGroupHolidayCountry(input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: qk.groups() });
      qc.invalidateQueries({ queryKey: qk.group(vars.groupId) });
    },
  });
}

export function useUpdateGroupManager() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateGroupManagerInput) => updateGroupManager(input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: qk.groups() });
      qc.invalidateQueries({ queryKey: qk.group(vars.groupId) });
      qc.invalidateQueries({ queryKey: qk.groupUsers(vars.groupId) });
      qc.invalidateQueries({ queryKey: ["organization"] });
    },
  });
}

export function useMySettings() {
  return useQuery({
    queryKey: qk.mySettings(),
    queryFn: getMySettings,
  });
}

export function useUpdateMySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserSettingsInput) => updateMySettings(input),
    onSuccess: (settings) => qc.setQueryData(qk.mySettings(), settings),
  });
}

export function useMyBirthday() {
  return useQuery({
    queryKey: qk.myBirthday(),
    queryFn: getMyBirthday,
  });
}

// The dashboard's birthday reads all sit under the "birthdays" prefix.
const BIRTHDAYS_PREFIX = ["birthdays"] as const;

export function useSaveMyBirthday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MyBirthday) => putMyBirthday(input),
    onSuccess: (settings) => {
      qc.setQueryData(qk.myBirthday(), settings);
      void qc.invalidateQueries({ queryKey: BIRTHDAYS_PREFIX });
    },
    onError: (error) => {
      if (errorCode(error) === BIRTHDAY_SHARE_PLAN_REQUIRED) {
        void qc.invalidateQueries({ queryKey: qk.myBirthday() });
      }
    },
  });
}

export function useRemoveMyBirthday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteMyBirthday(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.myBirthday() });
      void qc.invalidateQueries({ queryKey: BIRTHDAYS_PREFIX });
    },
  });
}

export function useAccountDeletionStatus() {
  return useQuery({
    queryKey: qk.accountDeletion(),
    queryFn: getAccountDeletionStatus,
  });
}

export function useDeleteMyAccount() {
  return useMutation({
    mutationFn: (password?: string) => deleteMyAccount(password),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useDeleteAllNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteAllNotifications(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGroupInput) => createGroup(input),
    onSuccess: () => invalidateAfterMembershipChange(qc),
  });
}

// A new membership, joined or created, changes what the dashboard counts and
// scopes to, the user's balances, and what they may mirror from.
function invalidateAfterMembershipChange(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: qk.groups() });
  qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
  qc.invalidateQueries({ queryKey: qk.reportScope() });
  qc.invalidateQueries({ queryKey: ["my-balances"] });
  qc.invalidateQueries({ queryKey: ["group-mirrors"] });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => joinGroupByCode(code),
    onSuccess: () => invalidateAfterMembershipChange(qc),
  });
}

export function useInvitePreview(token: string) {
  return useQuery({
    queryKey: qk.invitePreview(token),
    queryFn: () => previewInvite(token),
    enabled: token.length > 0,
  });
}

export function useSignUpWithInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteSignUpInput) => signUpWithInvite(input),
    onSuccess: () => {
      invalidateAfterMembershipChange(qc);
      qc.invalidateQueries({ queryKey: ["invite-preview"] });
    },
  });
}

export function useJoinGroupByLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => joinGroupByLink(token),
    onSuccess: () => {
      invalidateAfterMembershipChange(qc);
      qc.invalidateQueries({ queryKey: ["invite-preview"] });
    },
  });
}

/** Admin-only; the endpoint 403s for everyone else, so gate the call site. */
export function useGroupInvites(groupId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: qk.groupInvites(groupId ?? ""),
    queryFn: () => listGroupInvites(groupId!),
    enabled: enabled && !!groupId,
  });
}

export function useCreateGroupInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGroupInviteInput) => createGroupInvite(input),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: qk.groupInvites(vars.groupId) }),
  });
}

export function useRevokeGroupInvite(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => revokeGroupInvite(inviteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.groupInvites(groupId) }),
  });
}

export function useGroupMirrors(groupId: string | null | undefined) {
  return useQuery({
    queryKey: qk.groupMirrors(groupId ?? ""),
    queryFn: () => getGroupMirrors(groupId!),
    enabled: !!groupId,
  });
}

export function useSetGroupMirrors() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SetGroupMirrorsInput) => setGroupMirrors(input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: qk.groupMirrors(vars.groupId) });
      // Mirrored records change what a group's calendar shows.
      qc.invalidateQueries({ queryKey: ["vacations"] });
    },
  });
}

export function useUpdateGroupUsers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateGroupUsersInput) => updateGroupUsers(input),
    onSettled: (_, __, vars) => qc.invalidateQueries({ queryKey: qk.groupUsers(vars.groupId) }),
  });
}

export const CALENDAR_SYNCING_REFETCH_MS = 3000;

export function useCalendarSyncs() {
  return useQuery({
    queryKey: qk.calendarSyncs(),
    queryFn: listCalendarSyncs,
    refetchInterval: (query) =>
      query.state.data?.some((config) => config.target?.syncing === true)
        ? CALENDAR_SYNCING_REFETCH_MS
        : false,
  });
}

export function useCreateCalendarSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CalendarSyncInput) => createCalendarSync(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.calendarSyncs() }),
  });
}

export function useUpdateCalendarSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; input: CalendarSyncInput }) =>
      updateCalendarSync(vars.id, vars.input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.calendarSyncs() }),
  });
}

export function useDeleteCalendarSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCalendarSync(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.calendarSyncs() }),
  });
}

export function useRegenerateCalendarSyncToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => regenerateCalendarSyncToken(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.calendarSyncs() }),
  });
}

// Each config's `target` mirrors its connection's state, so both lists move together.
function invalidateCalendarSyncDependants(qc: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: qk.calendarSyncs() }),
    qc.invalidateQueries({ queryKey: qk.calendarConnections() }),
  ]);
}

export function useCalendarConnections() {
  return useQuery({
    queryKey: qk.calendarConnections(),
    queryFn: listConnections,
  });
}

/** Sends the browser to the provider's consent screen for one `ME` config. */
export function useStartCalendarConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { provider: CalendarProviderSlug; configId: UUID }) =>
      startConnection(vars.provider, {
        configId: vars.configId,
        timeZone: browserTimezone() ?? "UTC",
      }),
    onSuccess: ({ url }) => window.location.assign(url),
    // A refusal means the page is stale: a provider switched off, a target set elsewhere.
    onError: () => invalidateCalendarSyncDependants(qc),
  });
}

export function useDisconnectCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: CalendarProviderSlug) => disconnectCalendar(provider),
    onSettled: () => invalidateCalendarSyncDependants(qc),
  });
}

export function useSetCalendarTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { configId: UUID; timeZone: string }) =>
      setCalendarTarget(vars.configId, { timeZone: vars.timeZone }),
    onSettled: () => invalidateCalendarSyncDependants(qc),
  });
}

export function useRemoveCalendarTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (configId: UUID) => removeCalendarTarget(configId),
    onSettled: () => invalidateCalendarSyncDependants(qc),
  });
}

export function useSyncCalendarNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (configId: UUID) => syncCalendarNow(configId),
    onSettled: () => invalidateCalendarSyncDependants(qc),
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: qk.subscription(),
    queryFn: getBillingOverview,
  });
}

export function useOrganizations() {
  return useQuery({
    queryKey: qk.organizations(),
    queryFn: listOrganizations,
  });
}

/** `enabled` keeps the first render from firing an unscoped request that the real id immediately replaces. */
export function useOrganization(organizationId?: string | null) {
  return useQuery({
    queryKey: qk.organization(organizationId),
    queryFn: () => getOrganization(organizationId),
    enabled: !!organizationId,
  });
}

/** Owner-only; skipped for a delegated admin, who would only get a 403. */
export function useOrganizationCandidates(organizationId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: qk.organizationCandidates(organizationId),
    queryFn: () => listOrganizationCandidates(organizationId),
    enabled,
  });
}

export function useUpdateOrganization(organizationId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name?: string;
      billingEmail?: string;
      sickDayBenefitEnabled?: boolean;
    }) => updateOrganization({ ...input, organizationId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.organization(organizationId) });
      qc.invalidateQueries({ queryKey: qk.organizations() });
      // The organization name and benefit flag ride along with every group,
      // so the badges and the billing screen are both stale after a change.
      qc.invalidateQueries({ queryKey: qk.groups() });
      qc.invalidateQueries({ queryKey: ["group"] });
      qc.invalidateQueries({ queryKey: qk.subscription() });
    },
  });
}

/** Org-admin only; skipped for anyone else, who would only get a 403 or a 404. */
export function useAttendanceSettings(organizationId: string | null) {
  return useQuery({
    queryKey: qk.attendanceSettings(organizationId),
    queryFn: () => getAttendanceSettings(organizationId),
    enabled: !!organizationId,
  });
}

export function useUpdateAttendanceSettings(organizationId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<UpdateAttendanceSettingsInput, "organizationId">) =>
      updateAttendanceSettings({ ...input, organizationId }),
    onSuccess: (settings) => {
      qc.setQueryData(qk.attendanceSettings(organizationId), settings);
      qc.invalidateQueries({ queryKey: qk.attendanceSettings(organizationId) });
    },
  });
}

/**
 * The clock's one read, for anyone with an Employment — not an admin surface,
 * unlike {@link useAttendanceSettings}. A running session ages in seconds, so
 * it is refetched when the tab comes back rather than trusting the shared
 * 30-second staleTime.
 */
export function useAttendanceState(organizationId?: string | null) {
  return useQuery({
    queryKey: qk.attendanceState(organizationId),
    queryFn: () => getAttendanceState(organizationId),
    refetchOnWindowFocus: true,
  });
}

/**
 * The four clock writes, which all answer with a fragment of the state rather
 * than the whole of it — so each one invalidates the read instead of patching
 * the cache and risking a widget that disagrees with the server about whether
 * a break is running.
 */
function useAttendanceWrite<T>(
  mutationFn: () => Promise<T>,
  afterSuccess?: (result: T, refresh: () => void) => void
) {
  const qc = useQueryClient();
  // The whole prefix, not one key: the widget reads its state unscoped and
  // writes with the organization that read named, so an exact key would
  // invalidate an entry nothing is subscribed to and leave the clock stale.
  const refresh = () => void qc.invalidateQueries({ queryKey: ["attendance-state"] });
  return useMutation({
    mutationFn,
    onSuccess: (result) => {
      afterSuccess?.(result, refresh);
      refresh();
    },
    // A 409 means the widget was acting on a stale answer; the refetch is what
    // puts the right button back in front of the person.
    onError: refresh,
  });
}

/**
 * The clock-in and clock-out hooks take `locationEnabled` from the state read
 * rather than deciding for themselves, because a browser that is never asked is
 * the whole point of the organization's switch.
 *
 * The capture is fired and forgotten — it settles tens of seconds after the
 * mutation has, and nothing it can do is the person's problem — but the day
 * view is refetched once it is over, or the coordinates would sit in the
 * database until the next thing happened to invalidate the read.
 */
const locationAfter = (end: AttendanceSessionEnd, locationEnabled: boolean) =>
  locationEnabled
    ? (session: AttendanceSession, refresh: () => void) =>
        void captureSessionLocation(session.id, end).then(refresh)
    : undefined;

export const useClockIn = (organizationId?: string | null, locationEnabled = false) =>
  useAttendanceWrite(() => clockIn(organizationId), locationAfter("IN", locationEnabled));

export const useClockOut = (organizationId?: string | null, locationEnabled = false) =>
  useAttendanceWrite(() => clockOut(organizationId), locationAfter("OUT", locationEnabled));

/**
 * One month of the caller's own attendance. The week view asks for the month or
 * two its days fall in rather than a range of its own, so a week that straddles
 * a month boundary is two cached entries and neither is refetched when the
 * other moves.
 *
 * A running session ages, so this is refetched on focus like the clock's read —
 * the current month's last day is the one on the screen most of the time.
 */
export function useAttendanceMonth(
  year: number,
  month: number,
  organizationId?: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: qk.attendanceMonth(year, month, organizationId),
    queryFn: () => getAttendanceMonth(year, month, organizationId),
    refetchOnWindowFocus: true,
    enabled,
  });
}

/**
 * One person's business date, which is what the correction dialog opens onto.
 * `enabled` is the dialog being open: nothing asks for a day nobody is looking
 * at, and the answer is stale the moment a correction lands.
 */
export function useAttendanceDay(params: AttendanceDayParams | null, enabled = true) {
  return useQuery({
    queryKey: params ? qk.attendanceDay(params) : ["attendance-day", "unscoped"],
    queryFn: () => getAttendanceDay(params!),
    enabled: !!params && enabled,
  });
}

/** A session's timeline, read beside the fields that are about to change it. */
export function useSessionEvents(sessionId: string | null, enabled = true) {
  return useQuery({
    queryKey: qk.attendanceEvents(sessionId ?? "none"),
    queryFn: () => getSessionEvents(sessionId!),
    enabled: !!sessionId && enabled,
  });
}

/**
 * A correction moves figures every attendance read has already computed — the
 * day, the month, the team matrix and the clock — so all four prefixes go
 * rather than one key. Corrections are rare and the reads are cheap; a screen
 * still showing the old number is the expensive outcome.
 *
 * On settle rather than on success: a dropped connection or a 5xx can arrive
 * after the write committed. A failure has no session to name its timeline,
 * so `sessionOf` reads it off the input, and without one every timeline goes.
 */
function useCorrection<T>(
  mutationFn: (input: T) => Promise<AttendanceSession>,
  sessionOf?: (input: T) => string
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: (session, _error, input) => {
      for (const key of [
        "attendance-day",
        "attendance-month",
        "attendance-team",
        "attendance-state",
      ]) {
        qc.invalidateQueries({ queryKey: [key] });
      }
      const sessionId = session?.id ?? sessionOf?.(input);
      qc.invalidateQueries({
        queryKey: sessionId ? qk.attendanceEvents(sessionId) : ["attendance-events"],
      });
    },
  });
}

export const useCorrectSession = () =>
  useCorrection(
    ({ sessionId, patch }: { sessionId: string; patch: AttendanceCorrection }) =>
      correctSession(sessionId, patch),
    ({ sessionId }) => sessionId
  );

export const useCorrectBreak = () =>
  useCorrection(({ breakId, patch }: { breakId: string; patch: AttendanceCorrection }) =>
    correctBreak(breakId, patch)
  );

export const useRemoveBreak = () => useCorrection((breakId: string) => removeBreak(breakId));

export const useRemoveSession = () =>
  useCorrection(
    (sessionId: string) => removeSession(sessionId),
    (sessionId) => sessionId
  );

export const useEnterSession = () => useCorrection((entry: AttendanceEntry) => enterSession(entry));

export const useAddBreak = () =>
  useCorrection(
    ({ sessionId, span }: { sessionId: string; span: AttendanceBreakSpan }) =>
      addBreak(sessionId, span),
    ({ sessionId }) => sessionId
  );

export const useMarkSessionChecked = () =>
  useCorrection(
    (sessionId: string) => markSessionChecked(sessionId),
    (sessionId) => sessionId
  );

/**
 * The team dashboard, an admin surface like the roster: `enabled` is the
 * caller's say on whether the viewer administers anything, since the backend
 * would only answer 403. Refetched on focus like the month, because somebody
 * clocked in right now ages by the minute.
 */
export function useTeamAttendance(params: TeamAttendanceParams | null, enabled = true) {
  return useQuery({
    queryKey: params ? qk.attendanceTeam(params) : ["attendance-team", "unscoped"],
    queryFn: () => getTeamAttendance(params!),
    refetchOnWindowFocus: true,
    enabled: !!params && enabled,
  });
}

/** Org-admin only, like the roster it lists; skipped for anyone else. */
export function useEmployments(organizationId: string | null, enabled = true) {
  return useQuery({
    queryKey: qk.employments(organizationId),
    queryFn: () => listEmployments(organizationId!),
    enabled: !!organizationId && enabled,
  });
}

/**
 * The per-person required-time override. Every month already cached was
 * measured against the old figure, so they all go rather than the roster alone.
 */
export function useUpdateEmploymentRequiredMinutes(organizationId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      employmentId,
      requiredMinutesPerDay,
    }: {
      employmentId: string;
      requiredMinutesPerDay: number | null;
    }) => updateEmploymentRequiredMinutes(employmentId, requiredMinutesPerDay),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.employments(organizationId) });
      qc.invalidateQueries({ queryKey: ["attendance-month"] });
    },
  });
}

/**
 * End employment. The person leaves every group and loses their pending and
 * future bookings, so member lists, Team attendance and every booking read go
 * with the roster.
 */
export function useEndEmployment(organizationId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employmentId, endedOn }: { employmentId: string; endedOn: string }) =>
      endEmployment(employmentId, endedOn),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.employments(organizationId) });
      // A preview of an ended record answers 409, so drop it rather than refetch it.
      qc.removeQueries({ queryKey: ["directory", "end-preview"] });
      qc.invalidateQueries({ queryKey: ["directory"] });
      qc.invalidateQueries({ queryKey: qk.organization(organizationId) });
      qc.invalidateQueries({ queryKey: ["group-users"] });
      qc.invalidateQueries({ queryKey: ["attendance-team"] });
      qc.invalidateQueries({ queryKey: qk.subscription() });
      invalidateVacationDependants(qc);
    },
  });
}

export function useEraseEmployment(organizationId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employmentId, confirmName }: { employmentId: string; confirmName: string }) =>
      eraseEmployment(employmentId, confirmName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.employments(organizationId) });
      qc.invalidateQueries({ queryKey: ["directory"] });
      qc.invalidateQueries({ queryKey: qk.organization(organizationId) });
      qc.invalidateQueries({ queryKey: qk.requestedExports(organizationId) });
      qc.invalidateQueries({ queryKey: qk.organizationExport(organizationId) });
      qc.invalidateQueries({ queryKey: ["group-users"] });
      qc.invalidateQueries({ queryKey: ["attendance-team"] });
      qc.invalidateQueries({ queryKey: qk.subscription() });
      invalidateVacationDependants(qc);
    },
  });
}

/** How often a list with an export still being prepared asks again. */
export const EXPORT_POLL_MS = 3000;

const preparing = (exports: (PersonExport | null)[] | undefined) =>
  exports?.some((entry) => entry?.status === "PENDING") ?? false;

/** The Person exports the caller requested in the organization, polled while one is preparing. */
export function useRequestedExports(organizationId: string | null) {
  return useQuery({
    queryKey: qk.requestedExports(organizationId),
    queryFn: () => listRequestedExports(organizationId!),
    enabled: !!organizationId,
    refetchInterval: (query) => (preparing(query.state.data) ? EXPORT_POLL_MS : false),
  });
}

/** The organizations the caller can export their own data from, polled while one is preparing. */
export function useOwnExportOrganizations() {
  return useQuery({
    queryKey: qk.ownExports(),
    queryFn: listOwnExportOrganizations,
    refetchInterval: (query) =>
      preparing(query.state.data?.map((entry) => entry.export)) ? EXPORT_POLL_MS : false,
  });
}

/** An admin's export of one Employment. Every export list goes, the admin's own included. */
export function useRequestPersonExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (employmentId: string) => requestPersonExport(employmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["person-exports"] }),
  });
}

export function useRequestOwnPersonExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (organizationId: string) => requestOwnPersonExport(organizationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["person-exports"] }),
  });
}

/** The owner's newest Organization export, polled while it is preparing. Owner only. */
export function useOrganizationExport(organizationId: string | null, enabled = true) {
  return useQuery({
    queryKey: qk.organizationExport(organizationId),
    queryFn: () => getOrganizationExport(organizationId!),
    enabled: enabled && !!organizationId,
    refetchInterval: (query) => (preparing([query.state.data ?? null]) ? EXPORT_POLL_MS : false),
  });
}

export function useRequestOrganizationExport(organizationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => requestOrganizationExport(organizationId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.organizationExport(organizationId) }),
  });
}

export const useStartBreak = (organizationId?: string | null) =>
  useAttendanceWrite(() => startBreak(organizationId));

export const useEndBreak = (organizationId?: string | null) =>
  useAttendanceWrite(() => endBreak(organizationId));

export function useAddOrganizationAdmin(organizationId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => addOrganizationAdmin({ userId, organizationId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.organization(organizationId) });
      qc.invalidateQueries({ queryKey: qk.organizationCandidates(organizationId) });
    },
  });
}

export function useRemoveOrganizationAdmin(organizationId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeOrganizationAdmin({ userId, organizationId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.organization(organizationId) });
      qc.invalidateQueries({ queryKey: qk.organizationCandidates(organizationId) });
    },
  });
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: (input: CheckoutInput) => createCheckout(input),
  });
}

export function useCreatePortalSession() {
  return useMutation({
    mutationFn: () => createPortalSession(),
  });
}

export function useUpdateExtraSlots() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (extraGroupSlots: number) => updateExtraSlots(extraGroupSlots),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.subscription() }),
  });
}

export function useChangePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { plan: PaidPlan; billingCycle: BillingCycle }) => changePlan(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.subscription() }),
  });
}

export function useRemoveGroupUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { groupId: string; userId: string }) =>
      removeGroupUser(vars.groupId, vars.userId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: qk.groupUsers(vars.groupId) });
      qc.invalidateQueries({ queryKey: qk.subscription() });
      // The removal cancels the member's pending and future bookings there.
      invalidateVacationDependants(qc);
    },
  });
}

/**
 * Support surface — owner-only. Callers gate on `useSupportAdmin` first; the
 * backend re-checks its allowlist on every request regardless.
 */
export function useSupportOrganizations(query: string, enabled: boolean) {
  return useQuery({
    queryKey: qk.supportOrganizations(query),
    queryFn: () => searchSupportOrganizations(query),
    enabled,
    // A debug surface must not answer from cache: flipping between two terms
    // within the default staleTime would otherwise hide a fix just made.
    staleTime: 0,
  });
}

export function useSupportOrganization(organizationId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: qk.supportOrganization(organizationId ?? ""),
    queryFn: () => getSupportOrganization(organizationId ?? ""),
    enabled: enabled && !!organizationId,
  });
}

export function useSupportGroup(groupId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: qk.supportGroup(groupId ?? ""),
    queryFn: () => getSupportGroup(groupId ?? ""),
    enabled: enabled && !!groupId,
  });
}

/** Owner and org admins only; skipped without an organization. */
export function useDirectoryState(organizationId: string | null, enabled = true) {
  return useQuery({
    queryKey: qk.directoryState(organizationId),
    queryFn: () => getDirectoryState(organizationId!),
    enabled: !!organizationId && enabled,
  });
}

/** For everyone signed in: the People section and the directory page read it. */
export function useDirectoryOrganizations() {
  return useQuery({
    queryKey: qk.directoryOrganizations(),
    queryFn: listDirectoryOrganizations,
  });
}

export function useDirectoryPeople(organizationId: string | null) {
  return useQuery({
    queryKey: qk.directoryPeople(organizationId ?? ""),
    queryFn: () => listDirectoryPeople(organizationId!),
    enabled: !!organizationId,
  });
}

/** Owner, org admins and HR; pass `enabled` from the list's `formerList`. */
export function useFormerDirectoryPeople(organizationId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: qk.directoryFormer(organizationId ?? ""),
    queryFn: () => listFormerDirectoryPeople(organizationId!),
    enabled: !!organizationId && enabled,
  });
}

/** Country names in the answer follow the interface language, so the language is part of the key. */
export function useDirectoryProfile(organizationId: string, employmentId: string) {
  const { locale, localeReady } = useTranslation();
  return useQuery({
    queryKey: [...qk.directoryProfile(organizationId, employmentId), locale],
    queryFn: () => getDirectoryProfile(organizationId, employmentId, locale),
    enabled: localeReady && !!organizationId && !!employmentId,
  });
}

/** Owner, org admins and HR; pass `enabled` from the profile's `canReadHistory`. */
export function useProfileHistory(organizationId: string, employmentId: string, enabled: boolean) {
  return useQuery({
    queryKey: qk.directoryProfileHistory(organizationId, employmentId),
    queryFn: () => getProfileHistory(organizationId, employmentId),
    enabled: enabled && !!organizationId && !!employmentId,
  });
}

/** Fetched when the End dialog opens, so it shows what End does now. */
export function useEndPreview(organizationId: string, employmentId: string, enabled: boolean) {
  return useQuery({
    queryKey: qk.directoryEndPreview(organizationId, employmentId),
    queryFn: () => getEndPreview(organizationId, employmentId),
    enabled: enabled && !!organizationId && !!employmentId,
    staleTime: 0,
  });
}

export function useUpdateDirectoryProfile(organizationId: string, employmentId: string) {
  const qc = useQueryClient();
  const { locale } = useTranslation();
  return useMutation({
    mutationFn: (patch: DirectoryProfilePatch) =>
      updateDirectoryProfile(organizationId, employmentId, patch, locale),
    onSuccess: (profile) => {
      qc.setQueryData([...qk.directoryProfile(organizationId, employmentId), locale], profile);
      qc.invalidateQueries({ queryKey: ["directory"] });
    },
  });
}

/** Owner, org admins and HR; pass `enabled` from the list's `settings`. */
export function usePermissionTable(organizationId: string, enabled: boolean) {
  return useQuery({
    queryKey: qk.directoryPermissions(organizationId),
    queryFn: () => getPermissionTable(organizationId),
    enabled: enabled && !!organizationId,
  });
}

export function usePermissionHistory(organizationId: string, enabled: boolean) {
  return useQuery({
    queryKey: qk.directoryPermissionHistory(organizationId),
    queryFn: () => getPermissionHistory(organizationId),
    enabled: enabled && !!organizationId,
  });
}

export function useDirectoryRoles(organizationId: string, enabled: boolean) {
  return useQuery({
    queryKey: qk.directoryRoles(organizationId),
    queryFn: () => getDirectoryRoles(organizationId),
    enabled: enabled && !!organizationId,
  });
}

/** Owner only. Access changes everywhere, so every directory query refreshes. */
export function useUpdatePermissionCell(organizationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (change: {
      row: PermissionRow;
      audience: DirectoryAudience;
      value: PermissionValue;
    }) => updatePermissionCell(organizationId, change),
    onSuccess: (table) => {
      qc.setQueryData(qk.directoryPermissions(organizationId), table);
      qc.invalidateQueries({ queryKey: ["directory"] });
    },
  });
}

export function useSetDirectoryRoles(organizationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employmentId, roles }: { employmentId: string; roles: DirectoryRoleName[] }) =>
      setDirectoryRoles(organizationId, employmentId, roles),
    onSuccess: (roles) => {
      qc.setQueryData(qk.directoryRoles(organizationId), roles);
      qc.invalidateQueries({ queryKey: ["directory"] });
    },
  });
}

/**
 * Sends a picked file as the Profile photo: register, upload straight to the
 * store, then wait for the processing to settle. Resolves with how it settled,
 * or undefined while it is still processing after the wait.
 */
export function useUploadProfilePhoto(organizationId: string, employmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<ProfilePhotoUpload | undefined> => {
      const { photo, upload } = await startProfilePhotoUpload(organizationId, employmentId, {
        contentType: declaredContentType(file),
        size: file.size,
      });
      await uploadToTarget(upload, file);
      return waitForPhotoUpload(() =>
        getProfilePhotoUpload(organizationId, employmentId, photo.id)
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["directory"] });
    },
  });
}

export function useRemoveProfilePhoto(organizationId: string, employmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => removeProfilePhoto(organizationId, employmentId),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["directory"] });
    },
  });
}

export function useEnableDirectory(organizationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (agreementVersion: number) => enableDirectory(organizationId!, agreementVersion),
    onSuccess: (state) => {
      qc.setQueryData(qk.directoryState(organizationId), state);
      qc.invalidateQueries({ queryKey: ["directory"] });
    },
  });
}

export function useAcceptDirectoryAgreement(organizationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (agreementVersion: number) =>
      acceptDirectoryAgreement(organizationId!, agreementVersion),
    onSuccess: (state) => {
      qc.setQueryData(qk.directoryState(organizationId), state);
      qc.invalidateQueries({ queryKey: ["directory"] });
    },
  });
}
