import { api } from "./client";
import type {
  CreateGroupInput,
  Group,
  GroupDetail,
  GroupListItem,
  UpdateGroupHolidayCountryInput,
  UpdateGroupQuotasInput,
  UpdateGroupWorkingDaysInput,
} from "./types";

/** The caller's own groups — membership only. Organization-administered groups live on `/organization`. */
export function listGroups(): Promise<GroupListItem[]> {
  return api<GroupListItem[]>(`/api/group`);
}

/**
 * One group with the caller's effective rights. Unlike `listGroups` this also
 * reaches groups the caller only administers through their organization, which
 * is why the detail screens read permissions from here.
 */
export function getGroup(groupId: string): Promise<GroupDetail> {
  return api<GroupDetail>(`/api/group/${groupId}`);
}

export function createGroup(input: CreateGroupInput): Promise<Group> {
  return api<Group>(`/api/group`, { method: "POST", body: input });
}

/** Admin-only: change the defaults new members inherit. */
export function updateGroupQuotas({ groupId, ...body }: UpdateGroupQuotasInput): Promise<Group> {
  return api<Group>(`/api/group/${groupId}/quotas`, { method: "PUT", body });
}

/** Admin-only: set which weekdays the group treats as working days. */
export function updateGroupWorkingDays({
  groupId,
  ...body
}: UpdateGroupWorkingDaysInput): Promise<Group> {
  return api<Group>(`/api/group/${groupId}/working-days`, { method: "PUT", body });
}

/** Admin-only: set the country whose public holidays show on the dashboard (null = off). */
export function updateGroupHolidayCountry({
  groupId,
  ...body
}: UpdateGroupHolidayCountryInput): Promise<Group> {
  return api<Group>(`/api/group/${groupId}/holiday-country`, { method: "PUT", body });
}
