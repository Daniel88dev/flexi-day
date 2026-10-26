import { describe, expect, it } from "vitest";
import type { DirectoryProfile } from "@/lib/api/directory";
import {
  PROFILE_SECTION_KEYS,
  SECTION_WIRE_NAME,
  SECTION_WIRE_NAMES,
  writesAnySection,
} from "../sections";

const profile = (sections: DirectoryProfile["sections"]): DirectoryProfile => ({
  employmentId: "emp-1",
  organizationId: "org-1",
  name: "Ada",
  jobTitle: null,
  image: null,
  photoUrl: null,
  user: { id: null, name: "Ada", initials: "A", avatarColor: "hsl(1, 1%, 1%)" },
  markers: [],
  self: false,
  ended: false,
  canReadHistory: false,
  sections,
});

describe("SECTION_WIRE_NAMES", () => {
  it("returns every Section's wire name in profile order", () => {
    expect(SECTION_WIRE_NAMES).toEqual([
      "CARD",
      "PHOTO",
      "WORK_CONTACT",
      "JOB",
      "CONTACT",
      "PERSONAL",
    ]);
    expect(PROFILE_SECTION_KEYS.map((key) => SECTION_WIRE_NAME[key])).toEqual(SECTION_WIRE_NAMES);
  });
});

describe("writesAnySection", () => {
  it("returns false when every Section is read only or absent", () => {
    expect(writesAnySection(profile({ contact: { level: "READ" } }))).toBe(false);
    expect(writesAnySection(profile({}))).toBe(false);
  });

  it.each(PROFILE_SECTION_KEYS)("returns true when the viewer writes %s", (key) => {
    expect(
      writesAnySection(profile({ [key]: { level: "WRITE" } } as DirectoryProfile["sections"]))
    ).toBe(true);
  });
});
