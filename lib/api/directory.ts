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

/** Badges on a directory row. Only the owner, org admins and HR get the restricted ones. */
export type DirectoryMarker = "EXTERNAL_WORKER" | "NO_ACCOUNT" | "ACCOUNT_DELETED" | "REJOINED";

export type DirectoryPerson = {
  employmentId: string;
  name: string;
  /** The Account picture. */
  image: string | null;
  user: { id: string; name: string; initials: string; avatarColor: string };
  markers: DirectoryMarker[];
};

export type FormerDirectoryPerson = DirectoryPerson & { startedAt: string; endedAt: string };

export type DirectoryPeople = {
  people: DirectoryPerson[];
  /** The viewer may open the Former list: the owner, org admins and HR. */
  formerList: boolean;
};

export type DirectorySectionLevel = "READ" | "WRITE";
export type DirectorySectionView = { level: DirectorySectionLevel };

export type DirectoryAccountStatus = "ACTIVE" | "NO_ACCOUNT" | "DELETED";

export type DirectoryProfile = DirectoryPerson & {
  organizationId: string;
  self: boolean;
  ended: boolean;
  /** A key only for each Section the viewer reads. */
  sections: {
    card?: DirectorySectionView;
    photo?: DirectorySectionView;
    workContact?: DirectorySectionView;
    job?: DirectorySectionView & { spell: { startedAt: string; endedAt: string | null } };
    contact?: DirectorySectionView;
    personal?: DirectorySectionView;
  };
  /** For the owner, org admins, HR and the person. */
  account?: {
    status: DirectoryAccountStatus;
    signInEmail: string | null;
    directoryRoles: ("HR" | "LEADERSHIP")[];
  };
};

const directoryPath = (organizationId: string, rest: string) =>
  `/api/directory/${encodeURIComponent(organizationId)}/${rest}`;

export function listDirectoryPeople(organizationId: string): Promise<DirectoryPeople> {
  return api<DirectoryPeople>(directoryPath(organizationId, "people"));
}

/** Owner, org admins and HR only. */
export function listFormerDirectoryPeople(
  organizationId: string
): Promise<FormerDirectoryPerson[]> {
  return api<FormerDirectoryPerson[]>(directoryPath(organizationId, "former"));
}

export function getDirectoryProfile(
  organizationId: string,
  employmentId: string
): Promise<DirectoryProfile> {
  return api<DirectoryProfile>(
    directoryPath(organizationId, `people/${encodeURIComponent(employmentId)}`)
  );
}
