import { describe, expect, it } from "vitest";
import { directoryHref, organizationHref, profileEditHref, profileHref } from "../routes";

describe("directoryHref", () => {
  it("returns the directory of one organization, encoded", () => {
    expect(directoryHref("org 1&x")).toBe("/directory?organizationId=org%201%26x");
  });
});

describe("organizationHref", () => {
  it("returns the Organization page, encoded", () => {
    expect(organizationHref("org/1")).toBe("/organization?organizationId=org%2F1");
  });
});

describe("profileHref", () => {
  it("returns a profile with both ids encoded", () => {
    expect(profileHref("org-1", "emp#1")).toBe(
      "/directory/person?organizationId=org-1&employmentId=emp%231"
    );
  });
});

describe("profileEditHref", () => {
  it("returns the edit page", () => {
    expect(profileEditHref("org-1", "emp-1")).toBe(
      "/directory/person/edit?organizationId=org-1&employmentId=emp-1"
    );
  });

  it("returns the edit page scrolled to a block", () => {
    expect(profileEditHref("org-1", "emp-1", "record")).toBe(
      "/directory/person/edit?organizationId=org-1&employmentId=emp-1#record"
    );
  });
});
