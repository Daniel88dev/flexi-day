"use client";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "./client";
import {
  approveVacation,
  approveVacations,
  cancelVacations,
  commentVacation,
  createVacation,
  getVacation,
  listVacations,
  rejectVacation,
  rejectVacations,
  updateVacation,
  type ListVacationsParams,
} from "./vacations";
import {
  createGroup,
  getGroup,
  listGroups,
  updateGroupHolidayCountry,
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
  endBreak,
  getAttendanceMonth,
  getAttendanceState,
  getTeamAttendance,
  type TeamAttendanceParams,
  startBreak,
  type AttendanceSession,
  type AttendanceSessionEnd,
} from "./attendance";
import { listEmployments, updateEmploymentRequiredMinutes } from "./employment";
import { captureSessionLocation } from "@/lib/attendance/geolocation";
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
  listGroupInvites,
  listGroupUsers,
  removeGroupUser,
  revokeGroupInvite,
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
  getSupportGroup,
  getSupportOrganization,
  opaqueSearchKey,
  searchSupportOrganizations,
} from "./support";
import { listMyApprovals } from "./approvals";
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
import type {
  CreateGroupInput,
  CreateGroupInviteInput,
  CreateVacationInput,
  SetGroupMirrorsInput,
  SetUserQuotaInput,
  UpdateGroupHolidayCountryInput,
  UpdateGroupQuotasInput,
  UpdateGroupUsersInput,
  UpdateGroupWorkingDaysInput,
  UpdateUserSettingsInput,
  UpdateVacationInput,
} from "./types";

export const qk = {
  vacations: (year: number, month: number, groupId?: string | null, includeCancelled?: boolean) =>
    ["vacations", year, month, groupId ?? "mine", includeCancelled ?? false] as const,
  vacation: (id: string) => ["vacation", id] as const,
  groups: () => ["groups"] as const,
  group: (groupId: string) => ["group", groupId] as const,
  groupUsers: (groupId: string) => ["group-users", groupId] as const,
  groupInvites: (groupId: string) => ["group-invites", groupId] as const,
  groupMirrors: (groupId: string) => ["group-mirrors", groupId] as const,
  quotas: (groupId: string, year: number, userId?: string) =>
    ["quotas", groupId, year, userId ?? "all"] as const,
  myApprovals: () => ["my-approvals"] as const,
  dashboardSummary: () => ["dashboard-summary"] as const,
  myBalances: (year: number) => ["my-balances", year] as const,
  notifications: (unreadOnly: boolean) => ["notifications", unreadOnly] as const,
  bankHolidays: (year: number, country: string, region?: string) =>
    ["bank-holidays", year, country, region ?? "*"] as const,
  bankHolidayCountries: () => ["bank-holiday-countries"] as const,
  calendarSyncs: () => ["calendar-syncs"] as const,
  mySettings: () => ["my-settings"] as const,
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
  employments: (organizationId?: string | null) =>
    ["employments", organizationId ?? "own"] as const,
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
  qc.invalidateQueries({ queryKey: qk.dashboardSummary() });
  qc.invalidateQueries({ queryKey: ["my-balances"] });
}

export function useVacations(
  params: Required<Pick<ListVacationsParams, "year" | "month">> & {
    groupId?: string | null;
    includeCancelled?: boolean;
  }
) {
  return useQuery({
    queryKey: qk.vacations(params.year, params.month, params.groupId, params.includeCancelled),
    queryFn: () => listVacations(params),
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

export function useGroups() {
  return useQuery({
    queryKey: qk.groups(),
    queryFn: listGroups,
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

export function useDashboardSummary() {
  return useQuery({
    queryKey: qk.dashboardSummary(),
    queryFn: getDashboardSummary,
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

/** Bank holidays for several countries at once, merged into one flat list. */
export function useBankHolidaysMulti(year: number, countries: string[]) {
  const unique = Array.from(new Set(countries)).sort();
  return useQueries({
    queries: unique.map((country) => ({
      queryKey: qk.bankHolidays(year, country),
      queryFn: () => listBankHolidays({ year, country }),
    })),
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
    mutationFn: (ids: string[]) => approveVacations(ids),
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

export function useReportOverview(filters: ReportFilters, enabled = true) {
  return useQuery({
    queryKey: qk.reportOverview(filters),
    queryFn: () => getReportOverview(filters),
    enabled,
  });
}

export function useMemberReport(userId: string | null | undefined, year: number, enabled = true) {
  return useQuery({
    queryKey: qk.memberReport(userId ?? "", year),
    queryFn: () => getMemberReport(userId!, year),
    enabled: enabled && !!userId,
  });
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
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.groups() }),
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => joinGroupByCode(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.groups() });
      // A new membership changes what the dashboard counts and what the user
      // may mirror from.
      qc.invalidateQueries({ queryKey: qk.dashboardSummary() });
      qc.invalidateQueries({ queryKey: ["group-mirrors"] });
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
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: qk.groupUsers(vars.groupId) }),
  });
}

export function useCalendarSyncs() {
  return useQuery({
    queryKey: qk.calendarSyncs(),
    queryFn: listCalendarSyncs,
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
