import { describe, expect, it } from "vitest";
import type { DirectoryProfile } from "@/lib/api/directory";
import { buildProfilePatch, profileFormValues } from "../profile-form";

const profile = (overrides: Partial<DirectoryProfile["sections"]> = {}): DirectoryProfile => ({
  employmentId: "emp-1",
  organizationId: "org-1",
  name: "Ada Noaccount",
  jobTitle: "Agent",
  image: null,
  photoUrl: null,
  user: { id: "emp-1", name: "Ada Noaccount", initials: "AN", avatarColor: "hsl(1, 1%, 1%)" },
  markers: [],
  self: false,
  ended: false,
  canReadHistory: true,
  sections: {
    card: {
      level: "WRITE",
      jobTitle: "Agent",
      reportsTo: { employmentId: "emp-boss", name: "Boss" },
      nameFromAccount: false,
      department: { id: "d-sales", name: "Sales", archived: true },
      location: null,
    },
    job: {
      level: "WRITE",
      spell: { startedAt: "2025-02-03T08:00:00.000Z", endedAt: null },
      legalName: null,
      employeeNumber: "A-1",
      startDate: null,
      leavingDate: null,
      probationEndDate: null,
      contractType: "PERMANENT",
      workingTime: null,
    },
    ...overrides,
  },
});

describe("profileFormValues", () => {
  it("returns the stored values as form strings, with the start date left empty", () => {
    expect(profileFormValues(profile())).toEqual({
      name: "Ada Noaccount",
      signInEmail: "",
      jobTitle: "Agent",
      reportsTo: "emp-boss",
      department: "d-sales",
      location: "",
      workEmail: "",
      workPhoneCountry: "",
      workPhoneNumber: "",
      legalName: "",
      employeeNumber: "A-1",
      startDate: "",
      leavingDate: "",
      probationEndDate: "",
      contractType: "PERMANENT",
      workingTime: "",
    });
  });
});

describe("buildProfilePatch", () => {
  const can = { name: true, card: true, workContact: true, job: true };

  it("returns only the fields that changed, trimmed, with an emptied field as null", () => {
    const before = profileFormValues(profile());
    const after = {
      ...before,
      jobTitle: "  Team lead ",
      employeeNumber: "",
      startDate: "2024-03-01",
    };
    expect(buildProfilePatch(before, after, can)).toEqual({
      card: { jobTitle: "Team lead" },
      job: { employeeNumber: null, startDate: "2024-03-01" },
    });
  });

  it("returns an empty patch when nothing changed, ignoring surrounding spaces", () => {
    const before = profileFormValues(profile());
    expect(buildProfilePatch(before, { ...before, jobTitle: " Agent " }, can)).toEqual({});
  });

  it("sends the name only where it is editable, and never as a clear", () => {
    const before = profileFormValues(profile());
    expect(buildProfilePatch(before, { ...before, name: "Ada Lovelace" }, can)).toEqual({
      card: { name: "Ada Lovelace" },
    });
    expect(
      buildProfilePatch(before, { ...before, name: "Ada Lovelace" }, { ...can, name: false })
    ).toEqual({});
    expect(buildProfilePatch(before, { ...before, name: "  " }, can)).toEqual({});
  });

  it("sends the sign-in email lowercased where it is editable, and an emptied one as null", () => {
    const before = { ...profileFormValues(profile()), signInEmail: "ada@acme.test" };
    expect(
      buildProfilePatch(
        before,
        { ...before, signInEmail: " Ada.N@Acme.test " },
        { ...can, email: true }
      )
    ).toEqual({ card: { email: "ada.n@acme.test" } });
    expect(
      buildProfilePatch(before, { ...before, signInEmail: "" }, { ...can, email: true })
    ).toEqual({ card: { email: null } });
    expect(buildProfilePatch(before, { ...before, signInEmail: "x@acme.test" }, can)).toEqual({});
    expect(
      buildProfilePatch(
        before,
        { ...before, signInEmail: "ADA@acme.test" },
        { ...can, email: true }
      )
    ).toEqual({});
  });

  it("sends a picked Department and Location by id, and an emptied one as null", () => {
    const before = profileFormValues(profile());
    expect(
      buildProfilePatch(before, { ...before, department: "", location: "l-berlin" }, can)
    ).toEqual({ card: { departmentId: null, locationId: "l-berlin" } });
    expect(buildProfilePatch(before, { ...before }, can)).toEqual({});
  });

  it("leaves out a Section the viewer can't write", () => {
    const before = profileFormValues(profile());
    const after = { ...before, reportsTo: "", legalName: "Ada L." };
    expect(
      buildProfilePatch(before, after, { name: false, card: false, workContact: false, job: true })
    ).toEqual({
      job: { legalName: "Ada L." },
    });
    expect(
      buildProfilePatch(before, after, { name: false, card: true, workContact: false, job: false })
    ).toEqual({
      card: { reportsToEmploymentId: null },
    });
  });

  it("sends the work email lowercased and the work phone in E.164, only when they changed", () => {
    const before = profileFormValues(
      profile({
        workContact: {
          level: "WRITE",
          workEmail: "ada@acme.test",
          workPhone: {
            e164: "+420601123456",
            display: "+420 601 123 456",
            country: { code: "CZ", name: "Czechia" },
          },
        },
      })
    );
    expect(before).toMatchObject({ workPhoneCountry: "CZ", workPhoneNumber: "601 123 456" });
    expect(
      buildProfilePatch(
        before,
        { ...before, workEmail: " ADA@acme.test", workPhoneNumber: "601123456" },
        can
      )
    ).toEqual({});
    expect(
      buildProfilePatch(
        before,
        { ...before, workEmail: "Ada.Work@Acme.test", workPhoneNumber: "+44 20 7946 0958" },
        can
      )
    ).toEqual({ workContact: { workEmail: "ada.work@acme.test", workPhone: "+442079460958" } });
    expect(
      buildProfilePatch(before, { ...before, workEmail: "", workPhoneNumber: "" }, can)
    ).toEqual({ workContact: { workEmail: null, workPhone: null } });
    expect(
      buildProfilePatch(
        before,
        { ...before, workEmail: "x@acme.test" },
        { ...can, workContact: false }
      )
    ).toEqual({});
  });
});
