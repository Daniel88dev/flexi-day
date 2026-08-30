import { api } from "./client";
import type { Iso, UUID, UserSummary } from "./types";
import type { PlanName, SubscriptionStatus } from "./billing";

export type OrganizationSummary = {
  id: UUID;
  name: string;
  isOwner: boolean;
};

export type OrganizationAdmin = {
  userId: UUID;
  email: string;
  /** The owner is always listed first and cannot be revoked. */
  isOwner: boolean;
  grantedAt: Iso | null;
  user: UserSummary;
};

export type OrganizationCandidate = {
  userId: UUID;
  email: string;
  /** The organization's groups this person belongs to. */
  groupNames: string[];
  user: UserSummary;
};

export type OrganizationGroup = {
  id: UUID;
  groupName: string;
  members: number;
  createdAt: Iso;
};

export type OrganizationDetail = {
  organization: {
    id: UUID;
    name: string;
    isOwner: boolean;
    /** Null for a delegated admin — the billing address is owner-only. */
    billingEmail: string | null;
    /** Optional because the repos deploy independently; absent hides the benefit card. */
    sickDayBenefitEnabled?: boolean;
    createdAt: Iso;
  };
  plan: {
    plan: PlanName;
    status: SubscriptionStatus | null;
    writable: boolean;
    graceEndsAt: Iso | null;
    maxGroups: number;
    maxMembersPerGroup: number;
  };
  groups: OrganizationGroup[];
  admins: OrganizationAdmin[];
  viewer: { userId: UUID };
};

/** Organizations the caller owns or administers, owned first. Empty until they have one. */
export function listOrganizations(): Promise<OrganizationSummary[]> {
  return api<OrganizationSummary[]>(`/api/organization/list`);
}

const scoped = (path: string, organizationId?: string | null) =>
  organizationId ? `${path}?organizationId=${encodeURIComponent(organizationId)}` : path;

export function getOrganization(organizationId?: string | null): Promise<OrganizationDetail> {
  return api<OrganizationDetail>(scoped(`/api/organization`, organizationId));
}

export function updateOrganization(input: {
  organizationId?: string | null;
  name?: string;
  billingEmail?: string;
  sickDayBenefitEnabled?: boolean;
}): Promise<{
  id: UUID;
  name: string;
  isOwner: boolean;
  billingEmail: string | null;
  sickDayBenefitEnabled?: boolean;
}> {
  const { organizationId, ...body } = input;
  return api(scoped(`/api/organization`, organizationId), { method: "PATCH", body });
}

/** Owner-only: the organization's own group members, minus its existing admins. */
export function listOrganizationCandidates(
  organizationId?: string | null
): Promise<OrganizationCandidate[]> {
  return api<OrganizationCandidate[]>(scoped(`/api/organization/candidates`, organizationId));
}

export function addOrganizationAdmin(input: {
  userId: string;
  organizationId?: string | null;
}): Promise<OrganizationAdmin[]> {
  return api<OrganizationAdmin[]>(scoped(`/api/organization/admins`, input.organizationId), {
    method: "POST",
    body: { userId: input.userId },
  });
}

export function removeOrganizationAdmin(input: {
  userId: string;
  organizationId?: string | null;
}): Promise<OrganizationAdmin[]> {
  return api<OrganizationAdmin[]>(
    scoped(`/api/organization/admins/${input.userId}`, input.organizationId),
    { method: "DELETE" }
  );
}
