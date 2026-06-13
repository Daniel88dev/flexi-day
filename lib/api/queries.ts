"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveVacation,
  createVacation,
  listVacations,
  type ListVacationsParams,
} from "./vacations";
import { createGroup, listGroups } from "./groups";
import { joinGroupByCode, listGroupUsers, updateGroupUsers } from "./group-users";
import { listQuotas, type ListQuotasParams } from "./quotas";
import type { CreateGroupInput, CreateVacationInput, UpdateGroupUsersInput } from "./types";

export const qk = {
  vacations: (year: number, month: number) => ["vacations", year, month] as const,
  groups: () => ["groups"] as const,
  groupUsers: (groupId: string) => ["group-users", groupId] as const,
  quotas: (groupId: string, year: number, userId?: string) =>
    ["quotas", groupId, year, userId ?? "all"] as const,
};

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

export function useCreateVacation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVacationInput) => createVacation(input),
    onSuccess: (vac) => {
      const d = new Date(vac.requestedDay);
      qc.invalidateQueries({ queryKey: ["vacations"] });
      qc.invalidateQueries({ queryKey: qk.vacations(d.getFullYear(), d.getMonth() + 1) });
    },
  });
}

export function useApproveVacation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveVacation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vacations"] }),
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
