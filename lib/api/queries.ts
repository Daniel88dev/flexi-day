"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveVacation,
  cancelVacation,
  createVacation,
  listVacations,
  rejectVacation,
  type ListVacationsParams,
} from "./vacations";
import { createGroup, listGroups } from "./groups";
import { joinGroupByCode, listGroupUsers, updateGroupUsers } from "./group-users";
import { listQuotas, type ListQuotasParams } from "./quotas";
import { listMyApprovals } from "./approvals";
import { getDashboardSummary } from "./dashboard";
import { getMyBalances } from "./balances";
import {
  listNotifications,
  markNotificationRead,
  type ListNotificationsParams,
} from "./notifications";
import { listBankHolidays, type ListBankHolidaysParams } from "./bank-holidays";
import type { CreateGroupInput, CreateVacationInput, UpdateGroupUsersInput } from "./types";

export const qk = {
  vacations: (year: number, month: number) => ["vacations", year, month] as const,
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
};

function invalidateVacationDependants(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["vacations"] });
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
    mutationFn: (id: string) => approveVacation(id),
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

export function useCancelVacation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelVacation(id),
    onSuccess: () => invalidateVacationDependants(qc),
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
