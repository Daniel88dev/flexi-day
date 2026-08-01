import { api } from "./client";
import type { GroupMirror, GroupMirrorsResponse, SetGroupMirrorsInput } from "./types";

/** The caller's own mirroring setup for a group — never anyone else's. */
export function getGroupMirrors(groupId: string): Promise<GroupMirrorsResponse> {
  return api<GroupMirrorsResponse>(`/api/group/${groupId}/mirrors`);
}

export function setGroupMirrors({
  groupId,
  ...body
}: SetGroupMirrorsInput): Promise<GroupMirror[]> {
  return api<GroupMirror[]>(`/api/group/${groupId}/mirrors`, { method: "PUT", body });
}
