import { describe, expect, it } from "vitest";
import { phoneCountryOptions, phoneFormFields, phoneFromForm } from "../phone";

describe("phoneFromForm", () => {
  it("reads a national number in the picked country as E.164", () => {
    expect(phoneFromForm("CZ", "601 123 456")).toEqual({ e164: "+420601123456", valid: true });
  });

  it("takes a number typed in international form whatever the picker says", () => {
    expect(phoneFromForm("CZ", "+44 20 7946 0958")).toEqual({
      e164: "+442079460958",
      valid: true,
    });
    expect(phoneFromForm("", "+420 601 123 456")).toEqual({ e164: "+420601123456", valid: true });
  });

  it("reads an empty number as no phone", () => {
    expect(phoneFromForm("CZ", "  ")).toEqual({ e164: null, valid: true });
  });

  it("calls a number invalid when it is too short or has no country to read it in", () => {
    expect(phoneFromForm("CZ", "601 12").valid).toBe(false);
    expect(phoneFromForm("", "601 123 456").valid).toBe(false);
    expect(phoneFromForm("CZ", "call me").valid).toBe(false);
  });
});

describe("phoneFormFields", () => {
  it("splits a stored phone into its country and national number", () => {
    expect(
      phoneFormFields(
        {
          e164: "+420601123456",
          display: "+420 601 123 456",
          country: { code: "CZ", name: "Czechia" },
        },
        null
      )
    ).toEqual({ country: "CZ", number: "601 123 456" });
  });

  it("starts an empty phone on the server's default country, or none", () => {
    expect(phoneFormFields(null, { code: "CZ", name: "Česko" })).toEqual({
      country: "CZ",
      number: "",
    });
    expect(phoneFormFields(null, null)).toEqual({ country: "", number: "" });
  });
});

describe("phoneCountryOptions", () => {
  it("names every country with its calling code, sorted in the interface language", () => {
    const czech = phoneCountryOptions("cs");
    expect(czech).toContainEqual({ code: "CZ", label: "Česko (+420)" });
    expect(phoneCountryOptions("en")).toContainEqual({ code: "CZ", label: "Czechia (+420)" });
    const labels = czech.map((option) => option.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, "cs")));
  });
});
