import type { GroupEventGroup, GroupEventRow } from "@/lib/api/group-events";
import type { ViewerRoles } from "@/lib/viewer/use-viewer-roles";

const member: ViewerRoles = {
  isLoading: false,
  isOrgAdmin: false,
  isOrgOwner: false,
  organization: null,
  isGroupAdmin: false,
  administeredGroups: [],
  isApprover: false,
  plan: null,
  attendanceActive: false,
};

export const roles = {
  member,
  orgAdmin: { ...member, isOrgAdmin: true, isOrgOwner: true },
  groupAdmin: { ...member, isGroupAdmin: true },
  loadingAdmin: { ...member, isOrgAdmin: true, isLoading: true },
};

/** The clock's own read, which the bottom bar's centre slot and the Attendance link both hang off. */
export const clockState = {
  organizationId: "org-1",
  employmentId: "emp-1",
  employmentEnded: false,
  active: false,
  locationEnabled: false,
  timezone: "Europe/Prague",
  businessDate: "2026-09-11",
  openSession: null,
  openBreak: null,
  sessions: [],
  autoClosedSession: null,
};

export const groupEventGroups = {
  creatable: [
    { groupId: "g-1", groupName: "Design", canCreate: true },
    { groupId: "g-2", groupName: "Support", canCreate: true },
  ] as GroupEventGroup[],
  none: [{ groupId: "g-1", groupName: "Design", canCreate: false }] as GroupEventGroup[],
};

/** What the create answers; only the group and the first date matter to the shell. */
export const createdGroupEvent = {
  id: "ge-1",
  groupId: "g-2",
  groupName: "Support",
  title: "Offsite",
  startDate: "2026-11-03",
  endDate: "2026-11-03",
} as GroupEventRow;

/** Mutable seams the shell tests flip between cases; every mock factory reads them. */
export const shellState = {
  pathname: "/dashboard",
  isMobile: false,
  supportAdmin: false,
  roles: member as ViewerRoles,
  /** Undefined stands for a viewer with no Employment, whose clock never renders. */
  clock: undefined as typeof clockState | undefined,
  groupEventGroups: groupEventGroups.none,
};

export function resetShellState() {
  shellState.pathname = "/dashboard";
  shellState.isMobile = false;
  shellState.supportAdmin = false;
  shellState.roles = member;
  shellState.clock = undefined;
  shellState.groupEventGroups = groupEventGroups.none;
}

/** What the header widgets pull from the queries module; none of it matters to the shell. */
export const queryMocks = () => ({
  useNotifications: () => ({ data: [], isLoading: false, error: null }),
  useMarkNotificationRead: () => ({ mutate: () => {}, isPending: false }),
  useMarkAllNotificationsRead: () => ({ mutate: () => {}, isPending: false }),
  useDeleteNotification: () => ({ mutate: () => {}, isPending: false }),
  useDeleteAllNotifications: () => ({ mutate: () => {}, isPending: false }),
  useGroups: () => ({ data: [{ id: "g-1", name: "Design" }], isLoading: false }),
  useGroupEventGroups: () => ({ data: shellState.groupEventGroups, isPending: false }),
  useCreateVacation: () => ({ mutateAsync: async () => {}, isPending: false }),
  useGroup: () => ({ data: undefined, isLoading: false, error: null }),
  useGroupUsers: () => ({ data: [], isLoading: false, error: null }),
  useVacation: () => ({ data: undefined, isLoading: false, error: null }),
  useUploadAttachment: () => ({ mutateAsync: async () => {}, isPending: false }),
  useDeleteAttachment: () => ({ mutateAsync: async () => {}, isPending: false }),
  useSubscription: () => ({ data: undefined, isPending: false }),
  useAttendanceState: () => ({ data: shellState.clock, isPending: false }),
  useClockIn: () => ({ mutate: () => {}, isPending: false, error: null }),
  useClockOut: () => ({ mutate: () => {}, isPending: false, error: null }),
  useStartBreak: () => ({ mutate: () => {}, isPending: false, error: null }),
  useEndBreak: () => ({ mutate: () => {}, isPending: false, error: null }),
});
