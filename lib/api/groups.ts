import { api } from "./client";
import type { CreateGroupInput, Group, UpdateGroupQuotasInput } from "./types";

export function listGroups(): Promise<Group[]> {
  return api<Group[]>(`/api/group`);
}

export function createGroup(input: CreateGroupInput): Promise<Group> {
  return api<Group>(`/api/group`, { method: "POST", body: input });
}

/** Admin-only: change the defaults new members inherit. */
export function updateGroupQuotas({ groupId, ...body }: UpdateGroupQuotasInput): Promise<Group> {
  return api<Group>(`/api/group/${groupId}/quotas`, { method: "PUT", body });
}
