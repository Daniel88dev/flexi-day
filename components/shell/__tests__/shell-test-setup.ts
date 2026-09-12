import type { ViewerRoles } from "@/lib/viewer/use-viewer-roles";

const member: ViewerRoles = {
  isLoading: false,
  isOrgAdmin: false,
  isOrgOwner: false,
  organization: null,
  isGroupAdmin: false,
  administeredGroups: [],
  plan: null,
  attendanceActive: false,
};

export const roles = {
  member,
  orgAdmin: { ...member, isOrgAdmin: true, isOrgOwner: true },
  groupAdmin: { ...member, isGroupAdmin: true },
  loadingAdmin: { ...member, isOrgAdmin: true, isLoading: true },
};

/** Mutable seams the shell tests flip between cases; every mock factory reads them. */
export const shellState = {
  pathname: "/dashboard",
  isMobile: false,
  supportAdmin: false,
  roles: member as ViewerRoles,
};

export function resetShellState() {
  shellState.pathname = "/dashboard";
  shellState.isMobile = false;
  shellState.supportAdmin = false;
  shellState.roles = member;
}

/** What the header widgets pull from the queries module; none of it matters to the shell. */
export const queryMocks = () => ({
  useNotifications: () => ({ data: [], isLoading: false, error: null }),
  useMarkNotificationRead: () => ({ mutate: () => {}, isPending: false }),
  useMarkAllNotificationsRead: () => ({ mutate: () => {}, isPending: false }),
  useDeleteNotification: () => ({ mutate: () => {}, isPending: false }),
  useDeleteAllNotifications: () => ({ mutate: () => {}, isPending: false }),
  useGroups: () => ({ data: [], isLoading: false }),
  useCreateVacation: () => ({ mutateAsync: async () => {}, isPending: false }),
  useGroup: () => ({ data: undefined, isLoading: false, error: null }),
  useGroupUsers: () => ({ data: [], isLoading: false, error: null }),
  useVacation: () => ({ data: undefined, isLoading: false, error: null }),
  useUploadAttachment: () => ({ mutateAsync: async () => {}, isPending: false }),
  useDeleteAttachment: () => ({ mutateAsync: async () => {}, isPending: false }),
  useSubscription: () => ({ data: undefined, isPending: false }),
});
