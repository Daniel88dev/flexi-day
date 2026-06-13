import { api } from "./client";
import type { GroupUser, UpdateGroupUsersInput } from "./types";

export function listGroupUsers(groupId: string): Promise<GroupUser[]> {
  return api<GroupUser[]>(`/api/group-user/${groupId}`);
}

export function joinGroupByCode(validationCode: string): Promise<GroupUser> {
  return api<GroupUser>(`/api/group-user/code/${validationCode}`, { method: "POST" });
}

export function updateGroupUsers(input: UpdateGroupUsersInput): Promise<{ message: string }> {
  return api<{ message: string }>(`/api/group-user`, { method: "PUT", body: input });
}
