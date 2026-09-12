import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { GroupListItem } from "@/lib/api/types";
import type { OrganizationDetail, OrganizationSummary } from "@/lib/api/organization";
import type { BillingOverview } from "@/lib/api/billing";

type QueryState<T> = { data: T | undefined; isPending: boolean };

const pending = <T>(): QueryState<T> => ({ data: undefined, isPending: true });
const loaded = <T>(data: T): QueryState<T> => ({ data, isPending: false });

const sessionState = { data: null as { user: { id: string } } | null, isPending: false };
const state = {
  organizations: pending<OrganizationSummary[]>(),
  organization: pending<OrganizationDetail>(),
  groups: pending<GroupListItem[]>(),
  subscription: pending<BillingOverview>(),
};
const useOrganizationMock = vi.fn<(id?: string | null) => QueryState<OrganizationDetail>>(
  () => state.organization
);

vi.mock("@/lib/auth-client", () => ({
  useSession: () => sessionState,
}));

vi.mock("@/lib/api/queries", () => ({
  useOrganizations: () => state.organizations,
  useOrganization: (id?: string | null) => useOrganizationMock(id),
  useGroups: () => state.groups,
  useSubscription: () => state.subscription,
}));

import { useViewerRoles } from "../use-viewer-roles";

const overview = (
  organization: BillingOverview["organization"],
  plan: BillingOverview["entitlements"]["plan"] = "FREE",
  writable = true
): BillingOverview => ({
  organization,
  subscription: null,
  entitlements: { plan, maxGroups: 3, maxMembersPerGroup: 10, writable, graceEndsAt: null },
  usage: { groupsUsed: 0, groups: [] },
  planLimits: {
    FREE: { groups: 3, membersPerGroup: 10, maxExtraSlots: 0 },
    PRO: { groups: 5, membersPerGroup: 25, maxExtraSlots: 4 },
    ENTERPRISE: { groups: 20, membersPerGroup: 100, maxExtraSlots: 20 },
  },
});

const group = (
  id: string,
  groupName: string,
  organizationId: string,
  role: { manager?: boolean; adminAccess?: boolean } = {}
): GroupListItem => ({
  id,
  organizationId,
  organization: null,
  groupName,
  defaultVacationDays: 20,
  defaultHomeOfficeDays: 0,
  workingDays: [1, 2, 3, 4, 5],
  holidayCountry: null,
  managerUserId: role.manager ? "me" : "someone-else",
  mainApprovalUser: null,
  tempApprovalUser: null,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  membership: { adminAccess: role.adminAccess ?? false, approverAccess: false },
});

const detail = (
  organization: OrganizationDetail["organization"],
  groups: { id: string; groupName: string }[]
): OrganizationDetail => ({
  organization,
  plan: {
    plan: "PRO",
    status: "active",
    writable: true,
    graceEndsAt: null,
    maxGroups: 5,
    maxMembersPerGroup: 25,
  },
  groups: groups.map((g) => ({ ...g, members: 3, createdAt: "2026-01-01T00:00:00.000Z" })),
  admins: [],
  viewer: { userId: "me" },
});

const acme: OrganizationDetail["organization"] = {
  id: "org-1",
  name: "Acme",
  isOwner: true,
  billingEmail: "owner@acme.test",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("useViewerRoles", () => {
  beforeEach(() => {
    sessionState.data = { user: { id: "me" } };
    sessionState.isPending = false;
    state.organizations = pending();
    state.organization = pending();
    state.groups = pending();
    state.subscription = pending();
    useOrganizationMock.mockClear();
  });

  it("reports loading and no roles while any composed query is still pending", () => {
    const { result } = renderHook(() => useViewerRoles());

    expect(result.current).toEqual({
      isLoading: true,
      isOrgAdmin: false,
      isOrgOwner: false,
      organization: null,
      isGroupAdmin: false,
      administeredGroups: [],
      plan: null,
    });
    expect(useOrganizationMock).toHaveBeenCalledWith(null);
  });

  it("reports loading while the session itself is still pending", () => {
    sessionState.data = null;
    sessionState.isPending = true;
    state.organizations = loaded([]);
    state.groups = loaded([]);
    state.subscription = loaded(overview(null));

    expect(renderHook(() => useViewerRoles()).result.current.isLoading).toBe(true);
  });

  it("keeps loading until the administered organization's detail has answered", () => {
    state.organizations = loaded([{ id: "org-1", name: "Acme", isOwner: true }]);
    state.groups = loaded([]);
    state.subscription = loaded(overview({ ...acme, hasPaddleCustomer: true }, "PRO"));

    const { result } = renderHook(() => useViewerRoles());

    expect(result.current.isLoading).toBe(true);
    expect(useOrganizationMock).toHaveBeenCalledWith("org-1");
  });

  it("gives a plain member no roles and the Free plan", () => {
    state.organizations = loaded([]);
    state.groups = loaded([group("g-1", "Support", "org-9")]);
    state.subscription = loaded(overview(null));

    const { result } = renderHook(() => useViewerRoles());

    expect(result.current).toEqual({
      isLoading: false,
      isOrgAdmin: false,
      isOrgOwner: false,
      organization: null,
      isGroupAdmin: false,
      administeredGroups: [],
      plan: { name: "FREE", active: false },
    });
    expect(useOrganizationMock).toHaveBeenCalledWith(null);
  });

  it("makes an owner the admin of their organization and of every one of its groups", () => {
    state.organizations = loaded([{ id: "org-1", name: "Acme", isOwner: true }]);
    state.organization = loaded(
      detail(acme, [
        { id: "g-1", groupName: "Sales" },
        { id: "g-2", groupName: "Support" },
      ])
    );
    // Manages Sales themselves — Support is theirs through the organization.
    state.groups = loaded([group("g-1", "Sales", "org-1", { manager: true, adminAccess: true })]);
    state.subscription = loaded(overview({ ...acme, hasPaddleCustomer: true }, "PRO"));

    const { result } = renderHook(() => useViewerRoles());

    expect(result.current).toEqual({
      isLoading: false,
      isOrgAdmin: true,
      isOrgOwner: true,
      organization: { id: "org-1", name: "Acme", isOwner: true },
      isGroupAdmin: true,
      administeredGroups: [
        { id: "g-1", groupName: "Sales", viaOrgAdmin: false },
        { id: "g-2", groupName: "Support", viaOrgAdmin: true },
      ],
      plan: { name: "PRO", active: true },
    });
  });

  it("makes a delegate an admin of the organization they hold a row in, not its owner", () => {
    state.organizations = loaded([{ id: "org-1", name: "Acme", isOwner: false }]);
    state.organization = loaded(
      detail({ ...acme, isOwner: false, billingEmail: null }, [{ id: "g-2", groupName: "Support" }])
    );
    state.groups = loaded([]);
    state.subscription = loaded(
      overview({ ...acme, isOwner: false, billingEmail: null, hasPaddleCustomer: true }, "PRO")
    );

    const { result } = renderHook(() => useViewerRoles());

    expect(result.current).toEqual({
      isLoading: false,
      isOrgAdmin: true,
      isOrgOwner: false,
      organization: { id: "org-1", name: "Acme", isOwner: false },
      isGroupAdmin: true,
      administeredGroups: [{ id: "g-2", groupName: "Support", viaOrgAdmin: true }],
      plan: { name: "PRO", active: true },
    });
  });

  it("makes a group manager the admin of that group alone, with no organization", () => {
    state.organizations = loaded([]);
    state.groups = loaded([
      group("g-1", "Sales", "org-1", { manager: true }),
      group("g-2", "Support", "org-1"),
    ]);
    state.subscription = loaded(overview(null, "FREE"));

    const { result } = renderHook(() => useViewerRoles());

    expect(result.current).toEqual({
      isLoading: false,
      isOrgAdmin: false,
      isOrgOwner: false,
      organization: null,
      isGroupAdmin: true,
      administeredGroups: [{ id: "g-1", groupName: "Sales", viaOrgAdmin: false }],
      plan: { name: "FREE", active: false },
    });
    expect(useOrganizationMock).toHaveBeenCalledWith(null);
  });

  it("counts a member with admin access as the group's admin, like the backend does", () => {
    state.organizations = loaded([]);
    state.groups = loaded([group("g-3", "Ops", "org-1", { adminAccess: true })]);
    state.subscription = loaded(overview(null, "FREE"));

    expect(renderHook(() => useViewerRoles()).result.current.administeredGroups).toEqual([
      { id: "g-3", groupName: "Ops", viaOrgAdmin: false },
    ]);
  });

  it("lists only the group a member manages elsewhere, not the one they merely belong to", () => {
    state.organizations = loaded([]);
    state.groups = loaded([
      group("g-1", "Sales", "org-1"),
      group("g-7", "Side project", "org-2", { manager: true }),
    ]);
    state.subscription = loaded(overview(null, "FREE"));

    const { result } = renderHook(() => useViewerRoles());

    expect(result.current.isOrgAdmin).toBe(false);
    expect(result.current.isGroupAdmin).toBe(true);
    expect(result.current.administeredGroups).toEqual([
      { id: "g-7", groupName: "Side project", viaOrgAdmin: false },
    ]);
  });

  it("reports a lapsed paid plan as inactive", () => {
    state.organizations = loaded([{ id: "org-1", name: "Acme", isOwner: true }]);
    state.organization = loaded(detail(acme, []));
    state.groups = loaded([]);
    state.subscription = loaded(overview({ ...acme, hasPaddleCustomer: true }, "PRO", false));

    expect(renderHook(() => useViewerRoles()).result.current.plan).toEqual({
      name: "PRO",
      active: false,
    });
  });
});
