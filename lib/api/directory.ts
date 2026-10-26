import { api } from "./client";

export type DirectoryAgreementState = {
  currentVersion: number;
  acceptedVersion: number | null;
  acceptedAt: string | null;
  acceptedByName: string | null;
  /** On, and the latest acceptance is older than the current version. */
  newVersionReady: boolean;
};

export type DirectoryState = {
  organizationId: string;
  isOwner: boolean;
  enabled: boolean;
  enabledAt: string | null;
  disabledAt: string | null;
  /** The plan passes the directory gate: Enterprise or Custom. */
  writable: boolean;
  agreement: DirectoryAgreementState;
  people: { open: number; former: number };
};

export type DirectoryOrganizationRole = "OWNER" | "ORGANIZATION_ADMIN" | "MEMBER";

export type DirectoryOrganization = {
  organizationId: string;
  name: string;
  role: DirectoryOrganizationRole;
  enabled: boolean;
  writable: boolean;
  newAgreementVersionReady: boolean;
};

const scoped = (path: string, organizationId: string) =>
  `${path}?organizationId=${encodeURIComponent(organizationId)}`;

/** Owner and org admins only. */
export function getDirectoryState(organizationId: string): Promise<DirectoryState> {
  return api<DirectoryState>(scoped("/api/organization/directory", organizationId));
}

/** Owner only; sends the agreement version the owner was shown. */
export function enableDirectory(
  organizationId: string,
  agreementVersion: number
): Promise<DirectoryState> {
  return api<DirectoryState>(scoped("/api/organization/directory/enable", organizationId), {
    method: "POST",
    body: { agreementVersion },
  });
}

/** Owner only, while the directory is on. */
export function acceptDirectoryAgreement(
  organizationId: string,
  agreementVersion: number
): Promise<DirectoryState> {
  return api<DirectoryState>(scoped("/api/organization/directory/agreement", organizationId), {
    method: "POST",
    body: { agreementVersion },
  });
}

/** Every organization whose directory concerns the signed-in user. */
export function listDirectoryOrganizations(): Promise<DirectoryOrganization[]> {
  return api<DirectoryOrganization[]>("/api/directory/organizations");
}
