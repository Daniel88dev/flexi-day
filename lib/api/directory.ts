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
  /** A Card field. */
  jobTitle: string | null;
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

export type ContractType = "PERMANENT" | "FIXED_TERM" | "APPRENTICESHIP" | "INTERNSHIP" | "OTHER";
export type WorkingTime = "FULL_TIME" | "PART_TIME";
export const CONTRACT_TYPES: ContractType[] = [
  "PERMANENT",
  "FIXED_TERM",
  "APPRENTICESHIP",
  "INTERNSHIP",
  "OTHER",
];
export const WORKING_TIMES: WorkingTime[] = ["FULL_TIME", "PART_TIME"];

export type DirectoryCardView = DirectorySectionView & {
  jobTitle: string | null;
  /** `name` is null when the viewer can't reach that person. */
  reportsTo: { employmentId: string; name: string | null } | null;
  /** A bound, open account supplies the name, so nobody edits it here. */
  nameFromAccount: boolean;
};

export type DirectoryJobView = DirectorySectionView & {
  spell: { startedAt: string; endedAt: string | null };
  legalName: string | null;
  employeeNumber: string | null;
  /** `YYYY-MM-DD`, never filled in from the spell start. */
  startDate: string | null;
  leavingDate: string | null;
  probationEndDate: string | null;
  contractType: ContractType | null;
  workingTime: WorkingTime | null;
};

export type DirectoryAccountStatus = "ACTIVE" | "NO_ACCOUNT" | "DELETED";

export type DirectoryProfile = DirectoryPerson & {
  organizationId: string;
  self: boolean;
  ended: boolean;
  /** A key only for each Section the viewer reads. */
  sections: {
    card?: DirectoryCardView;
    photo?: DirectorySectionView;
    workContact?: DirectorySectionView;
    job?: DirectoryJobView;
    contact?: DirectorySectionView;
    personal?: DirectorySectionView;
  };
  /** The owner, org admins and HR read the profile history. */
  canReadHistory: boolean;
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

/** A value sets the field, `null` clears it, and a missing key leaves it alone. */
export type DirectoryProfilePatch = {
  card?: {
    name?: string;
    jobTitle?: string | null;
    reportsToEmploymentId?: string | null;
  };
  job?: {
    legalName?: string | null;
    employeeNumber?: string | null;
    startDate?: string | null;
    leavingDate?: string | null;
    probationEndDate?: string | null;
    contractType?: ContractType | null;
    workingTime?: WorkingTime | null;
  };
};

export function updateDirectoryProfile(
  organizationId: string,
  employmentId: string,
  patch: DirectoryProfilePatch
): Promise<DirectoryProfile> {
  return api<DirectoryProfile>(
    directoryPath(organizationId, `people/${encodeURIComponent(employmentId)}`),
    { method: "PATCH", body: patch }
  );
}

export type ProfileHistorySection =
  "CARD" | "PHOTO" | "WORK_CONTACT" | "JOB" | "CONTACT" | "PERSONAL";

export type DirectoryAudience =
  | "OWNER"
  | "SELF"
  | "COLLEAGUE"
  | "EXTERNAL_WORKER"
  | "GROUP_ADMIN"
  | "HR"
  | "LEADERSHIP"
  | "ORGANIZATION_ADMIN";

export type ProfileHistoryEntry = {
  id: string;
  at: string;
  actorName: string | null;
  section: ProfileHistorySection;
  /** Field names, never values. */
  fields: string[];
  audience: DirectoryAudience;
};

/** Owner, org admins and HR only. */
export function getProfileHistory(
  organizationId: string,
  employmentId: string
): Promise<ProfileHistoryEntry[]> {
  return api<ProfileHistoryEntry[]>(
    directoryPath(organizationId, `people/${encodeURIComponent(employmentId)}/history`)
  );
}
