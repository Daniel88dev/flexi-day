import { api } from "./client";
import type { Iso, UUID } from "./types";

/**
 * Owner-only support surface. Every endpoint 404s for anyone not on the
 * backend allowlist, so these are only called from pages already gated by
 * `useSupportAdmin`.
 */

export type SupportOrganizationListItem = {
  id: UUID;
  name: string;
  ownerUserId: string;
  ownerName: string;
  ownerEmail: string;
  liveGroups: number;
  /** Resolved entitlement plan — "FREE" when there is no subscription row. */
  plan: string;
  status: string | null;
  createdAt: Iso;
};

export type SupportGroupListItem = {
  id: UUID;
  groupName: string;
  managerUserId: string;
  members: number;
  deletedAt: Iso | null;
  createdAt: Iso;
};

export type SupportOrganizationDetail = {
  organization: {
    id: UUID;
    name: string;
    billingEmail: string;
    paddleCustomerId: string | null;
    createdAt: Iso;
  };
  owner: { userId: string; name: string; email: string };
  plan: {
    plan: string;
    status: string | null;
    maxGroups: number;
    maxMembersPerGroup: number;
    writable: boolean;
    graceEndsAt: Iso | null;
  };
  groups: SupportGroupListItem[];
  admins: { userId: string; email: string; isOwner: boolean; grantedAt: Iso | null }[];
};

export type SupportGroupMember = {
  userId: string;
  name: string;
  email: string;
  viewAccess: boolean;
  adminAccess: boolean;
  approverAccess: boolean;
  controlledUser: boolean;
  deletedAt: Iso | null;
};

export type SupportQuotaRow = {
  userId: string;
  relatedYear: string;
  vacationDays: number;
  homeOfficeDays: number;
  carriedOverDays: number;
};

export type SupportVacationRow = {
  id: UUID;
  userId: string;
  userName: string;
  requestedDay: string;
  vacationType: string;
  halfDay: boolean;
  approvedAt: Iso | null;
  approvedBy: string | null;
  rejectedAt: Iso | null;
  deletedAt: Iso | null;
  createdAt: Iso;
};

export type SupportGroupDetail = {
  group: {
    id: UUID;
    groupName: string;
    organizationId: UUID;
    organizationName: string;
    managerUserId: string;
    mainApprovalUser: string | null;
    tempApprovalUser: string | null;
    defaultVacationDays: number;
    defaultHomeOfficeDays: number;
    workingDays: number[];
    holidayCountry: string | null;
    deletedAt: Iso | null;
    createdAt: Iso;
  };
  members: SupportGroupMember[];
  quotas: SupportQuotaRow[];
  vacations: SupportVacationRow[];
};

/**
 * Opaque cache-key token for a search term. Query keys are logged to Sentry
 * on failures, and the support search takes free text (customer emails), so
 * the raw term must never be a key segment. djb2 — a collision means two
 * terms share a cache entry, so one could briefly show the other's results;
 * with a 32-bit hash and a single support admin that risk is accepted.
 */
export function opaqueSearchKey(query: string): string {
  let hash = 5381;
  for (let i = 0; i < query.length; i++) {
    hash = ((hash << 5) + hash + query.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

export function searchSupportOrganizations(
  query?: string
): Promise<{ organizations: SupportOrganizationListItem[] }> {
  const qs = query?.trim() ? `?query=${encodeURIComponent(query.trim())}` : "";
  return api<{ organizations: SupportOrganizationListItem[] }>(`/api/support/organizations${qs}`);
}

export function getSupportOrganization(organizationId: string): Promise<SupportOrganizationDetail> {
  return api<SupportOrganizationDetail>(
    `/api/support/organizations/${encodeURIComponent(organizationId)}`
  );
}

export function getSupportGroup(groupId: string): Promise<SupportGroupDetail> {
  return api<SupportGroupDetail>(`/api/support/groups/${encodeURIComponent(groupId)}`);
}
