import type {
  DirectoryProfile,
  ProfileHistorySection,
  ProfileSectionKey,
} from "@/lib/api/directory";

export const PROFILE_SECTION_KEYS: ProfileSectionKey[] = [
  "card",
  "photo",
  "workContact",
  "job",
  "contact",
  "personal",
];

/** The name the history, the permission table and the retention settings give each Section. */
export const SECTION_WIRE_NAME: Record<ProfileSectionKey, ProfileHistorySection> = {
  card: "CARD",
  photo: "PHOTO",
  workContact: "WORK_CONTACT",
  job: "JOB",
  contact: "CONTACT",
  personal: "PERSONAL",
};

export const SECTION_WIRE_NAMES: ProfileHistorySection[] = PROFILE_SECTION_KEYS.map(
  (key) => SECTION_WIRE_NAME[key]
);

/** The viewer writes a Section the edit page holds. */
export const writesAnySection = (profile: DirectoryProfile) =>
  PROFILE_SECTION_KEYS.some((key) => profile.sections[key]?.level === "WRITE");
