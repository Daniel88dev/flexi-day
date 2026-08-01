import { api } from "./client";
import type {
  CreateGroupInviteInput,
  CreateGroupInviteResponse,
  GroupInvite,
  GroupUser,
  GroupUserListItem,
  UpdateGroupUsersInput,
} from "./types";

export function listGroupUsers(groupId: string): Promise<GroupUserListItem[]> {
  return api<GroupUserListItem[]>(`/api/group-user/${groupId}`);
}

export function joinGroupByCode(validationCode: string): Promise<GroupUser> {
  return api<GroupUser>(`/api/group-user/code/${validationCode}`, { method: "POST" });
}

export function updateGroupUsers(input: UpdateGroupUsersInput): Promise<{ message: string }> {
  return api<{ message: string }>(`/api/group-user`, { method: "PUT", body: input });
}

/** Admin-only: outstanding invites, codes included. */
export function listGroupInvites(groupId: string): Promise<GroupInvite[]> {
  return api<GroupInvite[]>(`/api/group-user/${groupId}/invites`);
}

export function createGroupInvite({
  groupId,
  ...body
}: CreateGroupInviteInput): Promise<CreateGroupInviteResponse> {
  return api<CreateGroupInviteResponse>(`/api/group-user/${groupId}/invites`, {
    method: "POST",
    body,
  });
}

export function revokeGroupInvite(inviteId: string): Promise<GroupInvite> {
  return api<GroupInvite>(`/api/group-user/invites/${inviteId}`, { method: "DELETE" });
}
