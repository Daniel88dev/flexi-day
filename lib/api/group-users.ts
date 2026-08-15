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

/**
 * Admin-only: removes a member (soft delete). Available even on read-only
 * over-limit groups — it is how an owner gets back under a plan limit.
 */
export function removeGroupUser(groupId: string, userId: string): Promise<GroupUser> {
  return api<GroupUser>(`/api/group-user/${groupId}/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}
