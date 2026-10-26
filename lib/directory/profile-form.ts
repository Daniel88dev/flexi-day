import type {
  ContractType,
  DirectoryProfile,
  DirectoryProfilePatch,
  WorkingTime,
} from "@/lib/api/directory";

/** The edit page's fields as text, `""` meaning empty. */
export type ProfileFormValues = {
  name: string;
  jobTitle: string;
  reportsTo: string;
  legalName: string;
  employeeNumber: string;
  startDate: string;
  leavingDate: string;
  probationEndDate: string;
  contractType: string;
  workingTime: string;
};

const CARD_FIELDS = { jobTitle: "jobTitle", reportsTo: "reportsToEmploymentId" } as const;
const JOB_FIELDS = [
  "legalName",
  "employeeNumber",
  "startDate",
  "leavingDate",
  "probationEndDate",
  "contractType",
  "workingTime",
] as const;

/** The stored values. The start date stays empty until someone sets it. */
export function profileFormValues(profile: DirectoryProfile): ProfileFormValues {
  const { card, job } = profile.sections;
  return {
    name: profile.name,
    jobTitle: card?.jobTitle ?? "",
    reportsTo: card?.reportsTo?.employmentId ?? "",
    legalName: job?.legalName ?? "",
    employeeNumber: job?.employeeNumber ?? "",
    startDate: job?.startDate ?? "",
    leavingDate: job?.leavingDate ?? "",
    probationEndDate: job?.probationEndDate ?? "",
    contractType: job?.contractType ?? "",
    workingTime: job?.workingTime ?? "",
  };
}

const valueOf = (text: string): string | null => (text.trim() === "" ? null : text.trim());

/**
 * The PATCH body for what changed between two sets of form values: a set field
 * carries its trimmed value, an emptied one `null`. Sections the viewer can't
 * write are left out, and so is a name that isn't editable or was emptied.
 */
export function buildProfilePatch(
  before: ProfileFormValues,
  after: ProfileFormValues,
  can: { name: boolean; card: boolean; job: boolean }
): DirectoryProfilePatch {
  const card: NonNullable<DirectoryProfilePatch["card"]> = {};
  const job: Record<string, string | null> = {};

  const name = valueOf(after.name);
  if (can.name && name !== null && name !== valueOf(before.name)) card.name = name;
  if (can.card) {
    for (const [field, key] of Object.entries(CARD_FIELDS) as [
      keyof typeof CARD_FIELDS,
      (typeof CARD_FIELDS)[keyof typeof CARD_FIELDS],
    ][]) {
      if (valueOf(before[field]) !== valueOf(after[field])) card[key] = valueOf(after[field]);
    }
  }
  if (can.job) {
    for (const field of JOB_FIELDS) {
      if (valueOf(before[field]) !== valueOf(after[field])) job[field] = valueOf(after[field]);
    }
  }

  const patch: DirectoryProfilePatch = {};
  if (Object.keys(card).length > 0) patch.card = card;
  if (Object.keys(job).length > 0) {
    patch.job = job as NonNullable<DirectoryProfilePatch["job"]> & {
      contractType?: ContractType | null;
      workingTime?: WorkingTime | null;
    };
  }
  return patch;
}
