import { api } from "./client";
import type {
  CreateGroupInviteInput,
  CreateGroupInviteResponse,
  GroupInvite,
  GroupUser,
  GroupUserListItem,
  InvitePreview,
  InviteSignUpInput,
  InviteSignUpResult,
  UpdateGroupUsersInput,
} from "./types";

export function listGroupUsers(groupId: string): Promise<GroupUserListItem[]> {
  return api<GroupUserListItem[]>(`/api/group-user/${groupId}`);
}

export function joinGroupByCode(validationCode: string): Promise<GroupUser> {
  return api<GroupUser>(`/api/group-user/code/${validationCode}`, { method: "POST" });
}

// The invite link secret rides in the body, never the URL, so it stays out of
// access logs and Sentry breadcrumbs.
export function previewInvite(token: string): Promise<InvitePreview> {
  return api<InvitePreview>(`/api/auth/invite/preview`, { method: "POST", body: { token } });
}

export function joinGroupByLink(token: string): Promise<GroupUser> {
  return api<GroupUser>(`/api/auth/invite/join`, { method: "POST", body: { token } });
}

export function signUpWithInvite(input: InviteSignUpInput): Promise<InviteSignUpResult> {
  return api<InviteSignUpResult>(`/api/auth/invite/sign-up`, { method: "POST", body: input });
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
