import type { Locale } from "@/lib/i18n/config";
import { api } from "./client";
import type { DirectoryEntryRef } from "./directory-lists";
import type { UploadTarget } from "./types";

export type DirectoryAgreementState = {
  currentVersion: number;
  acceptedVersion: number | null;
  acceptedAt: string | null;
  acceptedByName: string | null;
  /** Sent true to the owner only: on, and the latest acceptance is older than the current version. */
  newVersionReady: boolean;
};

export type DirectoryState = {
  organizationId: string;
  isOwner: boolean;
  enabled: boolean;
  enabledAt: string | null;
  disabledAt: string | null;
  /** The owner's last Delete all directory data; optional as an older backend sends none. */
  dataDeletedAt?: string | null;
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

export type EnableDirectoryInput = { agreementVersion: number; tellMembers: boolean };

/** Owner only; sends the agreement version the owner was shown. */
export function enableDirectory(
  organizationId: string,
  input: EnableDirectoryInput
): Promise<DirectoryState> {
  return api<DirectoryState>(scoped("/api/organization/directory/enable", organizationId), {
    method: "POST",
    body: input,
  });
}

/** Owner only. Ends nobody and keeps the data. */
export function disableDirectory(organizationId: string): Promise<DirectoryState> {
  return api<DirectoryState>(scoped("/api/organization/directory/disable", organizationId), {
    method: "POST",
  });
}

/** Owner only, while the directory is off, with the organization's name typed. */
export function deleteAllDirectoryData(
  organizationId: string,
  confirmName: string
): Promise<DirectoryState> {
  return api<DirectoryState>(scoped("/api/organization/directory/delete-all", organizationId), {
    method: "POST",
    body: { confirmName },
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
export type DirectoryMarker =
  "EXTERNAL_WORKER" | "NO_ACCOUNT" | "ACCOUNT_DELETED" | "REJOINED" | "INVITE_SENT";

export type DirectoryPerson = {
  employmentId: string;
  name: string;
  jobTitle: string | null;
  /** An archived entry still shows on the record that holds it. */
  department?: DirectoryEntryRef | null;
  location?: DirectoryEntryRef | null;
  image: string | null;
  /** The small Profile photo; null without one or without a read on the Photo Section. */
  photoUrl: string | null;
  /** `id` is null on a record without an account; key such a row by `employmentId`. */
  user: { id: string | null; name: string; initials: string; avatarColor: string };
  markers: DirectoryMarker[];
  /** In no group of the organization; sent to the owner and org admins only. */
  noGroup?: boolean;
};

/** Named as the keys of `DirectoryProfile.sections`. */
export type ProfileSectionKey = "card" | "photo" | "workContact" | "job" | "contact" | "personal";

export type FormerDirectoryPerson = DirectoryPerson & {
  /** Null when the viewer can't read Job; the server still orders the list by end date. */
  startedAt: string | null;
  endedAt: string | null;
  /** The earliest coming Retention purge among the Sections the viewer reads; null under a hold. */
  nextRemoval?: { section: ProfileSectionKey; date: string } | null;
  hold?: boolean;
};

export type RetentionHold = {
  setAt: string;
  /** Null once the setter's account is gone. */
  setBy: { userId: string; name: string | null } | null;
};

/**
 * One Section's retention on an ended record. `date` is a `YYYY-MM-DD`: the
 * nightly run that empties it, or the day a purge did.
 */
export type SectionRetention =
  | { status: "REMOVES_ON" | "REMOVED_ON"; date: string }
  | { status: "KEPT_UNTIL_ERASED" | "ON_HOLD" };

export type ProfileRetention = {
  hold: RetentionHold | null;
  /** Only Sections the viewer reads; one with nothing to say is absent. */
  sections: Partial<Record<ProfileSectionKey, SectionRetention>>;
};

export type DirectoryPeople = {
  people: DirectoryPerson[];
  /** The viewer may open the Former list: the owner, org admins and HR. */
  formerList: boolean;
  /** The viewer may open Directory settings: the owner, org admins and HR. */
  settings: boolean;
  /** The rows carry `noGroup`, so the No group filter shows: the owner and org admins. */
  noGroupFilter?: boolean;
  /** The viewer holds the Create account-less person act, so Add person shows. */
  addPerson?: boolean;
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
  department?: DirectoryEntryRef | null;
  location?: (DirectoryEntryRef & { country: DirectoryCountry | null }) | null;
};

/** ISO 3166-1 alpha-2 and its name in the language the request asked for. */
export type DirectoryCountry = { code: string; name: string };

/** A stored phone: E.164 for `tel:` links and the server's international display form. */
export type DirectoryPhone = { e164: string; display: string; country: DirectoryCountry | null };

export type DirectoryWorkContactView = DirectorySectionView & {
  workEmail: string | null;
  workPhone: DirectoryPhone | null;
  /** Only for viewers who write Work contact: where the phone country picker starts. */
  phoneCountryDefault?: DirectoryCountry | null;
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

/** Signed links that stay the same for an hour, so the browser caches the image. */
export type ProfilePhotoLinks = { smallUrl: string; fullUrl: string };

export type DirectoryPhotoView = DirectorySectionView & { photo: ProfilePhotoLinks | null };

/** Contact on a profile never carries its values; Show returns them. */
export type DirectoryContactView = DirectorySectionView & {
  /** The Art. 14 notice, filled in, for viewers who write Contact. */
  notice?: string;
  phoneCountryDefault?: DirectoryCountry | null;
};

export type SensitiveSection = "contact" | "personal";

export type EmergencyContact = { name: string; phone: DirectoryPhone };

export type ContactValues = {
  privatePhone: DirectoryPhone | null;
  privateEmail: string | null;
  emergencyContact1: EmergencyContact | null;
  emergencyContact2: EmergencyContact | null;
};

export type HomeAddress = {
  line1: string;
  line2: string | null;
  postalCode: string | null;
  city: string;
  region: string | null;
  country: DirectoryCountry;
};

export type PersonalValues = {
  homeAddress: HomeAddress | null;
  /** `YYYY-MM-DD`. */
  dateOfBirth: string | null;
};

type Shown = { level: DirectorySectionLevel; recorded: boolean };
export type ShownContact = Shown & { section: "CONTACT" } & ContactValues;
export type ShownPersonal = Shown & { section: "PERSONAL" } & PersonalValues;
export type ShownSection = ShownContact | ShownPersonal;

export type DirectoryAccountStatus = "ACTIVE" | "NO_ACCOUNT" | "DELETED";

export type DirectoryProfile = DirectoryPerson & {
  organizationId: string;
  self: boolean;
  ended: boolean;
  /** A key only for each Section the viewer reads. */
  sections: {
    card?: DirectoryCardView;
    photo?: DirectoryPhotoView;
    workContact?: DirectoryWorkContactView;
    job?: DirectoryJobView;
    contact?: DirectoryContactView;
    /** Absent on an External worker's record. */
    personal?: DirectorySectionView;
  };
  /** The owner, org admins and HR read the profile history. */
  canReadHistory: boolean;
  /** What the viewer may do to this record from its profile. */
  actions?: ProfileActions;
  /** On an ended record: the Retention hold and when each Section goes or went. */
  retention?: ProfileRetention;
  /** For the owner, org admins, HR and the person. */
  account?: {
    status: DirectoryAccountStatus;
    signInEmail: string | null;
    directoryRoles: DirectoryRoleName[];
  };
};

const directoryPath = (organizationId: string, rest: string) =>
  `/api/directory/${encodeURIComponent(organizationId)}/${rest}`;

/** `language` names the countries in the answer; the backend falls back to the stored setting. */
export const withLanguage = (path: string, language?: Locale) =>
  language ? `${path}?language=${language}` : path;

const personPath = (organizationId: string, employmentId: string, rest = "", language?: Locale) =>
  withLanguage(
    directoryPath(
      organizationId,
      `people/${encodeURIComponent(employmentId)}${rest ? `/${rest}` : ""}`
    ),
    language
  );

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
  employmentId: string,
  language?: Locale
): Promise<DirectoryProfile> {
  return api<DirectoryProfile>(personPath(organizationId, employmentId, "", language));
}

/** A value sets the field, `null` clears it, and a missing key leaves it alone. */
export type DirectoryProfilePatch = {
  card?: {
    name?: string;
    /** Only an open record without an account takes it. */
    email?: string | null;
    jobTitle?: string | null;
    reportsToEmploymentId?: string | null;
    departmentId?: string | null;
    locationId?: string | null;
  };
  workContact?: {
    workEmail?: string | null;
    /** E.164 or international form; the backend stores E.164. */
    workPhone?: string | null;
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
  contact?: {
    privatePhone?: string | null;
    privateEmail?: string | null;
    emergencyContact1?: { name: string; phone: string } | null;
    emergencyContact2?: { name: string; phone: string } | null;
  };
  personal?: {
    homeAddress?: {
      line1: string;
      line2: string | null;
      postalCode: string | null;
      city: string;
      region: string | null;
      /** ISO 3166-1 alpha-2. */
      country: string;
    } | null;
    dateOfBirth?: string | null;
  };
};

export type WorkerType = "employee" | "external";

/** Add person: a person without an account, with the Card fields the dialog offers. */
export type NewDirectoryPerson = {
  name: string;
  type: WorkerType;
  email?: string | null;
  card?: {
    jobTitle?: string;
    departmentId?: string;
    locationId?: string;
    reportsToEmploymentId?: string;
  };
};

export function createDirectoryPerson(
  organizationId: string,
  person: NewDirectoryPerson,
  language?: Locale
): Promise<DirectoryProfile> {
  return api<DirectoryProfile>(withLanguage(directoryPath(organizationId, "people"), language), {
    method: "POST",
    body: person,
  });
}

export type DirectoryInvite = {
  id: string;
  employmentId: string;
  groupId: string | null;
  email: string;
  status: "open";
  expiresAt: string;
  createdAt: string;
};

export type SentDirectoryInvite = { invite: DirectoryInvite; emailDelivered: boolean };

/** Emails a directory invite to a person without an account; a group is optional. */
export function sendDirectoryInvite(
  organizationId: string,
  employmentId: string,
  groupId: string | null
): Promise<SentDirectoryInvite> {
  return api<SentDirectoryInvite>(personPath(organizationId, employmentId, "invite"), {
    method: "POST",
    body: groupId ? { groupId } : {},
  });
}

/** Whether an open Employment of the organization already holds the email. The email stays in the body. */
export function checkDirectoryEmail(
  organizationId: string,
  email: string
): Promise<{ available: boolean }> {
  return api<{ available: boolean }>(directoryPath(organizationId, "people/email-check"), {
    method: "POST",
    body: { email },
  });
}

export function updateDirectoryProfile(
  organizationId: string,
  employmentId: string,
  patch: DirectoryProfilePatch,
  language?: Locale
): Promise<DirectoryProfile> {
  return api<DirectoryProfile>(personPath(organizationId, employmentId, "", language), {
    method: "PATCH",
    body: patch,
  });
}

/**
 * Change worker type. Turning a record external clears Contract type, Working
 * time, Probation end date and Personal on the server; turning it back
 * restores nothing.
 */
export function changeWorkerType(
  organizationId: string,
  employmentId: string,
  type: WorkerType,
  language?: Locale
): Promise<DirectoryProfile> {
  return api<DirectoryProfile>(personPath(organizationId, employmentId, "worker-type", language), {
    method: "PUT",
    body: { type },
  });
}

export const COPYABLE_SECTIONS = ["contact", "personal", "photo"] as const;

export type CopyableSectionKey = (typeof COPYABLE_SECTIONS)[number];

/** What one Section of the previous spell offers the new one. A copy never overwrites. */
export type CopyableSection =
  | { status: "COPYABLE" | "EMPTY" | "FILLED" | "NOT_WRITABLE" }
  | { status: "REMOVED_ON"; date: string };

export type PreviousSpell = {
  previous: { employmentId: string; startedAt: string; endedAt: string };
  /** Personal is absent when the new spell is an External worker's. */
  sections: Partial<Record<CopyableSectionKey, CopyableSection>>;
};

export function getPreviousSpell(
  organizationId: string,
  employmentId: string
): Promise<PreviousSpell> {
  return api<PreviousSpell>(personPath(organizationId, employmentId, "previous-spell"));
}

export function copyFromPreviousSpell(
  organizationId: string,
  employmentId: string,
  sections: CopyableSectionKey[],
  language?: Locale
): Promise<DirectoryProfile> {
  return api<DirectoryProfile>(
    personPath(organizationId, employmentId, "previous-spell/copy", language),
    { method: "POST", body: { sections } }
  );
}

/**
 * Show: the values of one Sensitive section. For anyone but the person this
 * writes one read-log row, so call it only on the viewer's click.
 */
export function showSensitiveSection(
  organizationId: string,
  employmentId: string,
  section: SensitiveSection,
  language?: Locale
): Promise<ShownSection> {
  return api<ShownSection>(personPath(organizationId, employmentId, `show/${section}`, language), {
    method: "POST",
  });
}

export type ReadLogEntry = {
  id: string;
  kind: "read" | "export";
  at: string;
  reader: { userId: string; name: string | null };
  /** `name` is null once the person was erased. */
  person: { employmentId: string | null; name: string | null };
  /** Null on an export. */
  sections: ("CONTACT" | "PERSONAL")[] | null;
  audience: DirectoryAudience;
};

export type ReadLogPage = {
  entries: ReadLogEntry[];
  nextBefore: string | null;
  people: { employmentId: string; name: string }[];
  readers: { userId: string; name: string | null }[];
};

export type ReadLogFilter = { employmentId?: string; readerUserId?: string; before?: string };

/** The owner and org admins only. */
export function getReadLog(
  organizationId: string,
  filter: ReadLogFilter = {}
): Promise<ReadLogPage> {
  const query = new URLSearchParams();
  if (filter.employmentId) query.set("employmentId", filter.employmentId);
  if (filter.readerUserId) query.set("readerUserId", filter.readerUserId);
  if (filter.before) query.set("before", filter.before);
  const search = query.toString();
  return api<ReadLogPage>(directoryPath(organizationId, `read-log${search ? `?${search}` : ""}`));
}

export type DirectoryGeneralSettings = {
  editable: boolean;
  /** The organization's own texts; null where it uses the default. */
  emergencyContactNotice: { en: string | null; cs: string | null };
  defaults: { en: string; cs: string };
  /** What `{period}` reads as. */
  period: { en: string; cs: string };
};

export function getDirectoryGeneralSettings(
  organizationId: string
): Promise<DirectoryGeneralSettings> {
  return api<DirectoryGeneralSettings>(directoryPath(organizationId, "settings/general"));
}

/** `null` goes back to the default; a missing language stays as it is. */
export function updateDirectoryGeneralSettings(
  organizationId: string,
  emergencyContactNotice: { en?: string | null; cs?: string | null }
): Promise<DirectoryGeneralSettings> {
  return api<DirectoryGeneralSettings>(directoryPath(organizationId, "settings/general"), {
    method: "PUT",
    body: { emergencyContactNotice },
  });
}

/** How long a Section is kept after an Employment ends, shortest first. */
export const RETENTION_PERIODS = [
  "AT_END",
  "DAYS_30",
  "MONTHS_6",
  "YEAR_1",
  "YEARS_3",
  "YEARS_5",
  "YEARS_10",
  "UNTIL_ERASED",
] as const;
export type RetentionPeriod = (typeof RETENTION_PERIODS)[number];

export type RetentionSettings = {
  /** The owner and org admins change these; HR reads them. */
  editable: boolean;
  periods: Record<ProfileHistorySection, RetentionPeriod>;
  defaults: Record<ProfileHistorySection, RetentionPeriod>;
};

export type RetentionPreview = {
  section: ProfileHistorySection;
  period: RetentionPeriod;
  /** People whose Section the next nightly run would remove under this period. */
  affected: number;
};

export function getRetentionSettings(organizationId: string): Promise<RetentionSettings> {
  return api<RetentionSettings>(directoryPath(organizationId, "settings/retention"));
}

/** The owner and org admins, on every plan. */
export function updateRetentionPeriod(
  organizationId: string,
  input: { section: ProfileHistorySection; period: RetentionPeriod }
): Promise<RetentionSettings> {
  return api<RetentionSettings>(directoryPath(organizationId, "settings/retention"), {
    method: "PUT",
    body: input,
  });
}

/** Changes nothing: counts who a period would remove at the next nightly run. */
export function getRetentionPreview(
  organizationId: string,
  input: { section: ProfileHistorySection; period: RetentionPeriod }
): Promise<RetentionPreview> {
  const query = new URLSearchParams(input).toString();
  return api<RetentionPreview>(
    directoryPath(organizationId, `settings/retention/preview?${query}`)
  );
}

export type ProfilePhotoUpload = {
  id: string;
  status: "UPLOADING" | "READY" | "REJECTED";
  rejectionReason: "TYPE_MISMATCH" | "IMAGE_UNREADABLE" | null;
};

/** Registers a Profile photo upload and answers where the bytes go. */
export function startProfilePhotoUpload(
  organizationId: string,
  employmentId: string,
  input: { contentType: string; size: number }
): Promise<{ photo: ProfilePhotoUpload; upload: UploadTarget }> {
  return api(personPath(organizationId, employmentId, "photo"), { method: "POST", body: input });
}

export function getProfilePhotoUpload(
  organizationId: string,
  employmentId: string,
  photoId: string
): Promise<ProfilePhotoUpload> {
  return api<ProfilePhotoUpload>(
    personPath(organizationId, employmentId, `photo/${encodeURIComponent(photoId)}`)
  );
}

/** Removes the Profile photo and both its sizes; works on every plan. */
export function removeProfilePhoto(organizationId: string, employmentId: string): Promise<void> {
  return api<void>(personPath(organizationId, employmentId, "photo"), { method: "DELETE" });
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
  /** A Section, or the Change worker type act, which records the field `type`. */
  section: ProfileHistorySection | "CHANGE_WORKER_TYPE";
  /** Field names, never values. */
  fields: string[];
  /** RETENTION for a Retention purge, which names no person and no audience. */
  actor?: "PERSON" | "RETENTION";
  audience: DirectoryAudience | null;
};

export type ProfileActions = {
  /** End employment, by the End act cell, on an open record that isn't the owner's. */
  end: boolean;
  /** The owner and org admins, for a person with an account. */
  export: boolean;
  /** The owner and org admins, for a Deleted account. */
  erase: boolean;
  /** The owner and org admins, on an ended record. */
  hold?: boolean;
  /** The act cell allows it, on an open record without an account. */
  invite?: boolean;
  /** The act cell allows it, on an open record. */
  changeType?: boolean;
  /**
   * Copy from previous spell: the owner, org admins and HR, on an open record
   * whose previous spell holds a Section they can copy.
   */
  copyFromPreviousSpell?: boolean;
};

/** The owner and org admins, on an ended record, on every plan. */
export function setRetentionHold(
  organizationId: string,
  employmentId: string,
  on: boolean
): Promise<{ hold: RetentionHold | null }> {
  return api<{ hold: RetentionHold | null }>(personPath(organizationId, employmentId, "hold"), {
    method: on ? "PUT" : "DELETE",
  });
}

/** What End employment would do, for the End dialog. */
export type EndPreview = {
  employmentId: string;
  /** Today in the organization's zone, the latest date End accepts. */
  today: string;
  /** The spell's first day, the earliest date End accepts. */
  startedOn: string;
  /** A Leaving date of today or earlier, else today. */
  suggestedEndedOn: string;
  /** Open records whose Reports to names this person, cleared by End. */
  reportees: { employmentId: string; name: string }[];
  groups: { id: string; name: string }[];
  /** End is refused while the person manages any of these. */
  managedGroups: { id: string; name: string }[];
  cancelledBookings: number;
  /** A delegated org-admin row End drops. */
  organizationAdmin: boolean;
  directoryRoles: DirectoryRoleName[];
  /** Sections set to "at end" that hold something; End empties them. */
  atEndSections?: ProfileHistorySection[];
};

/** Only for a viewer whose End act cell allows it. */
export function getEndPreview(organizationId: string, employmentId: string): Promise<EndPreview> {
  return api<EndPreview>(personPath(organizationId, employmentId, "end-preview"));
}

/** Owner, org admins and HR only. */
export function getProfileHistory(
  organizationId: string,
  employmentId: string
): Promise<ProfileHistoryEntry[]> {
  return api<ProfileHistoryEntry[]>(personPath(organizationId, employmentId, "history"));
}

export type DirectoryRoleName = "HR" | "LEADERSHIP";
export const DIRECTORY_ROLE_NAMES: DirectoryRoleName[] = ["HR", "LEADERSHIP"];

export type PermissionRow =
  | ProfileHistorySection
  | "CREATE_ACCOUNTLESS_PERSON"
  | "SEND_DIRECTORY_INVITE"
  | "CHANGE_WORKER_TYPE"
  | "END_EMPLOYMENT"
  | "MANAGE_DEPARTMENTS_AND_LOCATIONS";

export type PermissionValue = "NONE" | "READ" | "WRITE" | "ALLOWED" | "NO";

export type PermissionTableCell = {
  row: PermissionRow;
  audience: DirectoryAudience;
  value: PermissionValue;
  /** The owner can't change it. */
  fixed: boolean;
  /** The values the owner may set. */
  options: PermissionValue[];
};

export type PermissionTable = {
  /** Only the owner edits the table and assigns roles. */
  editable: boolean;
  /** The plan passes the directory gate; while it doesn't, cells may only narrow. */
  writable: boolean;
  cells: PermissionTableCell[];
};

export type DirectoryRoles = {
  editable: boolean;
  writable: boolean;
  /** Open Employments with a live account, the only ones that may hold a role. */
  people: { employmentId: string; name: string; roles: DirectoryRoleName[] }[];
};

export type RoleChangeReason = "OWNER" | "EMPLOYMENT_ENDED" | "ACCOUNT_DELETED";

export type PermissionHistoryEntry =
  | {
      kind: "CELL";
      id: string;
      at: string;
      actorName: string | null;
      row: PermissionRow;
      audience: DirectoryAudience;
      before: PermissionValue | null;
      after: PermissionValue;
    }
  | {
      kind: "ROLE";
      id: string;
      at: string;
      actorName: string | null;
      role: DirectoryRoleName;
      employmentId: string | null;
      personName: string | null;
      before: boolean;
      after: boolean;
      reason: RoleChangeReason;
    };

/** Owner, org admins and HR. */
export function getPermissionTable(organizationId: string): Promise<PermissionTable> {
  return api<PermissionTable>(directoryPath(organizationId, "permissions"));
}

/** Owner only. */
export function updatePermissionCell(
  organizationId: string,
  change: { row: PermissionRow; audience: DirectoryAudience; value: PermissionValue }
): Promise<PermissionTable> {
  return api<PermissionTable>(directoryPath(organizationId, "permissions"), {
    method: "PATCH",
    body: change,
  });
}

/** Owner, org admins and HR. */
export function getPermissionHistory(organizationId: string): Promise<PermissionHistoryEntry[]> {
  return api<PermissionHistoryEntry[]>(directoryPath(organizationId, "permissions/history"));
}

/** Owner, org admins and HR. */
export function getDirectoryRoles(organizationId: string): Promise<DirectoryRoles> {
  return api<DirectoryRoles>(directoryPath(organizationId, "roles"));
}

/** Owner only; `roles` is the whole set the person holds afterwards. */
export function setDirectoryRoles(
  organizationId: string,
  employmentId: string,
  roles: DirectoryRoleName[]
): Promise<DirectoryRoles> {
  return api<DirectoryRoles>(
    directoryPath(organizationId, `roles/${encodeURIComponent(employmentId)}`),
    { method: "PUT", body: { roles } }
  );
}

export type DirectoryChecklistItemKey = "departments" | "locations" | "hr" | "jobTitles";

/** The setup checklist on the directory page. `hr` and `reviewPermissions` come to the owner only. */
export type DirectoryChecklist = {
  hidden: boolean;
  items: { key: DirectoryChecklistItemKey; done: boolean }[];
  reviewPermissions: boolean;
};

/** The owner, org admins and HR. */
export function getDirectoryChecklist(organizationId: string): Promise<DirectoryChecklist> {
  return api<DirectoryChecklist>(directoryPath(organizationId, "checklist"));
}

/** Hides the checklist for the whole organization until the next enable. */
export function hideDirectoryChecklist(organizationId: string): Promise<DirectoryChecklist> {
  return api<DirectoryChecklist>(directoryPath(organizationId, "checklist/hide"), {
    method: "POST",
  });
}
