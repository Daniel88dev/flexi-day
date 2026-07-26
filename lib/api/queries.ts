"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveVacation,
  approveVacations,
  cancelVacation,
  cancelVacations,
  commentVacation,
  createVacation,
  getVacation,
  listVacations,
  rejectVacation,
  rejectVacations,
  type ListVacationsParams,
} from "./vacations";
import { createGroup, listGroups, updateGroupQuotas, updateGroupWorkingDays } from "./groups";
import { joinGroupByCode, listGroupUsers, updateGroupUsers } from "./group-users";
import { getCarryOverSuggestion, listQuotas, setUserQuota, type ListQuotasParams } from "./quotas";
import {
  getMemberReport,
  getReportOverview,
  getReportScope,
  reportFiltersToQuery,
} from "./reports";
import type { ReportFilters } from "./report-types";
import { getMySettings, updateMySettings } from "./settings";
import { listMyApprovals } from "./approvals";
import { getDashboardSummary } from "./dashboard";
import { getMyBalances } from "./balances";
import {
  listNotifications,
  markNotificationRead,
  type ListNotificationsParams,
} from "./notifications";
import { listBankHolidays, type ListBankHolidaysParams } from "./bank-holidays";
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
  CreateVacationInput,
  SetUserQuotaInput,
  UpdateGroupQuotasInput,
  UpdateGroupUsersInput,
  UpdateGroupWorkingDaysInput,
  UserSettings,
} from "./types";

export const qk = {
  vacations: (year: number, month: number) => ["vacations", year, month] as const,
  vacation: (id: string) => ["vacation", id] as const,
  groups: () => ["groups"] as const,
  groupUsers: (groupId: string) => ["group-users", groupId] as const,
  quotas: (groupId: string, year: number, userId?: string) =>
    ["quotas", groupId, year, userId ?? "all"] as const,
  myApprovals: () => ["my-approvals"] as const,
  dashboardSummary: () => ["dashboard-summary"] as const,
  myBalances: (year: number) => ["my-balances", year] as const,
  notifications: (unreadOnly: boolean) => ["notifications", unreadOnly] as const,
  bankHolidays: (year: number, country: string, region?: string) =>
    ["bank-holidays", year, country, region ?? "*"] as const,
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

export function useVacations(params: Required<ListVacationsParams>) {
  return useQuery({
    queryKey: qk.vacations(params.year, params.month),
    queryFn: () => listVacations(params),
  });
}

export function useVacation(id: string | null | undefined) {
  return useQuery({
    queryKey: qk.vacation(id ?? ""),
    queryFn: () => getVacation(id!),
    enabled: !!id,
  });
}

export function useGroups() {
  return useQuery({
    queryKey: qk.groups(),
    queryFn: listGroups,
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

export function useCreateVacation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVacationInput) => createVacation(input),
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

export function useCancelVacation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: string | { id: string; reason?: string }) =>
      typeof input === "string" ? cancelVacation(input) : cancelVacation(input.id, input.reason),
    onSuccess: () => invalidateVacationDependants(qc),
  });
}

export function useCancelVacations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { ids: string[]; reason?: string }) =>
      cancelVacations(input.ids, input.reason),
    onSuccess: () => invalidateVacationDependants(qc),
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

export function useReportOverview(filters: ReportFilters) {
  return useQuery({
    queryKey: qk.reportOverview(filters),
    queryFn: () => getReportOverview(filters),
  });
}

export function useMemberReport(userId: string | null | undefined, year: number) {
  return useQuery({
    queryKey: qk.memberReport(userId ?? "", year),
    queryFn: () => getMemberReport(userId!, year),
    enabled: !!userId,
  });
}

export function useUpdateGroupQuotas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateGroupQuotasInput) => updateGroupQuotas(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.groups() }),
  });
}

export function useUpdateGroupWorkingDays() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateGroupWorkingDaysInput) => updateGroupWorkingDays(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.groups() }),
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
    mutationFn: (input: UserSettings) => updateMySettings(input),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.groups() }),
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
