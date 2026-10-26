import { describe, expect, it } from "vitest";
import type { ContactValues, PersonalValues } from "@/lib/api/directory";
import {
  addressIncomplete,
  buildContactPatch,
  buildPersonalPatch,
  contactFormValues,
  contactProblems,
  hasContactProblem,
  personalFormValues,
  shownContactFrom,
  shownPersonalFrom,
} from "../sensitive-form";

const cz = { code: "CZ", name: "Czechia" };

const contact: ContactValues = {
  privatePhone: { e164: "+420777123456", display: "+420 777 123 456", country: cz },
  privateEmail: "jana@home.test",
  emergencyContact1: {
    name: "Karel",
    phone: { e164: "+420602111222", display: "+420 602 111 222", country: cz },
  },
  emergencyContact2: null,
};

const personal: PersonalValues = {
  homeAddress: {
    line1: "Vinohradská 12",
    line2: null,
    postalCode: "120 00",
    city: "Praha",
    region: null,
    country: cz,
  },
  dateOfBirth: "1990-04-17",
};

describe("contactFormValues", () => {
  it("splits each stored phone into its country and national number", () => {
    const values = contactFormValues(contact, null);
    expect(values).toMatchObject({
      privatePhoneCountry: "CZ",
      privatePhoneNumber: "777 123 456",
      emergency1Name: "Karel",
      emergency1Country: "CZ",
      emergency2Name: "",
      emergency2Number: "",
    });
  });

  it("starts empty phones on the default country", () => {
    const values = contactFormValues(
      { privatePhone: null, privateEmail: null, emergencyContact1: null, emergencyContact2: null },
      cz
    );
    expect(values.privatePhoneCountry).toBe("CZ");
    expect(values.emergency2Country).toBe("CZ");
  });
});

describe("buildContactPatch", () => {
  it("returns undefined when nothing changed", () => {
    const values = contactFormValues(contact, null);
    expect(buildContactPatch(values, { ...values })).toBeUndefined();
  });

  it("sends only the changed fields, a filled slot as a name and E.164, an emptied one as null", () => {
    const before = contactFormValues(contact, null);
    const after = {
      ...before,
      privateEmail: " Jana@Elsewhere.TEST ",
      emergency1Name: "",
      emergency1Number: "",
      emergency2Name: "Ema",
      emergency2Country: "CZ",
      emergency2Number: "603 333 444",
    };
    expect(buildContactPatch(before, after)).toEqual({
      privateEmail: "jana@elsewhere.test",
      emergencyContact1: null,
      emergencyContact2: { name: "Ema", phone: "+420603333444" },
    });
  });
});

describe("contactProblems", () => {
  it("flags a half-filled slot and an invalid phone", () => {
    const values = {
      ...contactFormValues(contact, null),
      emergency1Number: "",
      emergency2Name: "Ema",
      emergency2Country: "CZ",
      emergency2Number: "12",
    };
    const problems = contactProblems(values);
    expect(problems.emergency).toEqual({ 1: "incomplete", 2: "invalidPhone" });
    expect(hasContactProblem(problems)).toBe(true);
    expect(hasContactProblem(contactProblems(contactFormValues(contact, null)))).toBe(false);
  });
});

describe("buildPersonalPatch", () => {
  it("sends the whole address when a part changed, and null when every part is emptied", () => {
    const before = personalFormValues(personal);
    expect(buildPersonalPatch(before, { ...before, region: "Praha" })).toEqual({
      homeAddress: {
        line1: "Vinohradská 12",
        line2: null,
        postalCode: "120 00",
        city: "Praha",
        region: "Praha",
        country: "CZ",
      },
    });
    const emptied = {
      ...before,
      line1: "",
      postalCode: "",
      city: "",
      country: "",
      dateOfBirth: "",
    };
    expect(buildPersonalPatch(before, emptied)).toEqual({ homeAddress: null, dateOfBirth: null });
    expect(buildPersonalPatch(before, { ...before })).toBeUndefined();
  });
});

describe("addressIncomplete", () => {
  it("needs line 1, city and country once any part is filled", () => {
    const empty = personalFormValues({ homeAddress: null, dateOfBirth: null });
    expect(addressIncomplete(empty)).toBe(false);
    expect(addressIncomplete({ ...empty, postalCode: "120 00" })).toBe(true);
    expect(addressIncomplete(personalFormValues(personal))).toBe(false);
  });
});

describe("shownContactFrom and shownPersonalFrom", () => {
  it("rebuild the Show shape from the saved form", () => {
    expect(shownContactFrom(contactFormValues(contact, null), "WRITE", true, "en")).toEqual({
      section: "CONTACT",
      level: "WRITE",
      recorded: true,
      ...contact,
    });
    expect(shownPersonalFrom(personalFormValues(personal), "WRITE", false, "en")).toEqual({
      section: "PERSONAL",
      level: "WRITE",
      recorded: false,
      ...personal,
    });
  });
});
