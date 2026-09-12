"use client";

import {
  useAttendanceSettings,
  useGroups,
  useOrganization,
  useOrganizations,
  useSubscription,
} from "@/lib/api/queries";
import { useSession } from "@/lib/auth-client";
import type { PlanName } from "@/lib/api/billing";
import type { OrganizationSummary } from "@/lib/api/organization";
import type { UUID } from "@/lib/api/types";

export type AdministeredGroup = {
  id: UUID;
  groupName: string;
  /**
   * Authority came from administering the organization alone. False whenever
   * the viewer manages the group themselves, inside their own organization or
   * anyone else's.
   */
  viaOrgAdmin: boolean;
};

export type ViewerRoles = {
  /** True until every composed query has answered, so the shell can hold admin sections back. */
  isLoading: boolean;
  isOrgAdmin: boolean;
  isOrgOwner: boolean;
  /**
   * The organization the viewer administers: their own, else the one they
   * hold a delegate row in — the billing overview's pick, so `plan` describes
   * this organization. Null while loading and for a viewer who administers none.
   */
  organization: OrganizationSummary | null;
  isGroupAdmin: boolean;
  administeredGroups: AdministeredGroup[];
  /** `active` is what the backend's group badge calls active: paid and still writable. Null while loading. */
  plan: { name: PlanName; active: boolean } | null;
  /**
   * Attendance is switched on *and* the plan still allows it — the settings
   * payload's own answer, not a flag re-derived here. False for a viewer who
   * administers no organization, since the settings are an org-admin read.
   */
  attendanceActive: boolean;
};

const LOADING: ViewerRoles = {
  isLoading: true,
  isOrgAdmin: false,
  isOrgOwner: false,
  organization: null,
  isGroupAdmin: false,
  administeredGroups: [],
  plan: null,
  attendanceActive: false,
};

/**
 * What the viewer is allowed to *see*, in one place: whether they administer
 * an organization and which, which groups they administer and how, and the
 * organization's plan. Composed from the queries the screens already run —
 * nothing here is a new request. UI gating only: the backend re-checks every
 * action, so a wrong answer here hides a section, never grants one.
 */
export function useViewerRoles(): ViewerRoles {
  const session = useSession();
  const organizationsQuery = useOrganizations();
  const groupsQuery = useGroups();
  const subscriptionQuery = useSubscription();
  // Owned organizations sort first, so this is the viewer's own when they have one.
  const administered = organizationsQuery.data?.[0] ?? null;
  const organizationQuery = useOrganization(administered?.id ?? null);
  const attendanceQuery = useAttendanceSettings(administered?.id ?? null);

  // `isPending` rather than `isLoading`: a paused query still has no answer,
  // and the shell must not treat that as "plain member".
  if (
    session.isPending ||
    organizationsQuery.isPending ||
    groupsQuery.isPending ||
    subscriptionQuery.isPending ||
    (administered !== null && (organizationQuery.isPending || attendanceQuery.isPending))
  ) {
    return LOADING;
  }

  const viewerId = session.data?.user.id;
  const managed = new Map(
    (groupsQuery.data ?? [])
      .filter((group) => group.managerUserId === viewerId || group.membership?.adminAccess === true)
      .map((group) => [group.id, group.groupName])
  );
  const administeredGroups: AdministeredGroup[] = (organizationQuery.data?.groups ?? []).map(
    (group) => ({ id: group.id, groupName: group.groupName, viaOrgAdmin: !managed.has(group.id) })
  );
  for (const [id, groupName] of managed) {
    if (!administeredGroups.some((group) => group.id === id)) {
      administeredGroups.push({ id, groupName, viaOrgAdmin: false });
    }
  }

  const entitlements = subscriptionQuery.data?.entitlements;
  return {
    isLoading: false,
    isOrgAdmin: administered !== null,
    isOrgOwner: administered?.isOwner === true,
    organization: administered,
    isGroupAdmin: administeredGroups.length > 0,
    administeredGroups,
    plan: entitlements
      ? { name: entitlements.plan, active: entitlements.plan !== "FREE" && entitlements.writable }
      : null,
    attendanceActive: attendanceQuery.data?.active ?? false,
  };
}
