import { api } from "./client";
import type { GroupMirror, GroupMirrorsResponse, SetGroupMirrorsInput } from "./types";

/** A group's mirroring setup: every member for an admin, only the caller otherwise. */
export function getGroupMirrors(groupId: string): Promise<GroupMirrorsResponse> {
  return api<GroupMirrorsResponse>(`/api/group/${groupId}/mirrors`);
}

export function setGroupMirrors({
  groupId,
  ...body
}: SetGroupMirrorsInput): Promise<GroupMirror[]> {
  return api<GroupMirror[]>(`/api/group/${groupId}/mirrors`, { method: "PUT", body });
}
