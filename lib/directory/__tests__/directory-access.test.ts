import { describe, expect, it } from "vitest";
import type { DirectoryOrganization } from "@/lib/api/directory";
import { administers, directoryHome, directoryNavEntry } from "../directory-access";

const org = (overrides: Partial<DirectoryOrganization>): DirectoryOrganization => ({
  organizationId: "org-1",
  name: "Acme",
  role: "MEMBER",
  enabled: false,
  writable: false,
  newAgreementVersionReady: false,
  ...overrides,
});

describe("directoryNavEntry", () => {
  it("shows nothing while the list is loading", () => {
    expect(directoryNavEntry(undefined)).toBeNull();
  });

  it("shows a member the entry in a Directory organization, with no chip", () => {
    expect(directoryNavEntry([org({ enabled: true })])).toEqual({ enterpriseChip: false });
  });

  it("keeps the entry for a Directory organization after a lapse", () => {
    expect(directoryNavEntry([org({ enabled: true, writable: false })])).toEqual({
      enterpriseChip: false,
    });
  });

  it("shows a member nothing on Free, Pro or Enterprise while the directory is off", () => {
    expect(directoryNavEntry([org({ writable: false })])).toBeNull();
    expect(directoryNavEntry([org({ writable: true })])).toBeNull();
  });

  it.each(["OWNER", "ORGANIZATION_ADMIN"] as const)(
    "shows the %s the entry with the Enterprise chip on Free and Pro",
    (role) => {
      expect(directoryNavEntry([org({ role, writable: false })])).toEqual({
        enterpriseChip: true,
      });
    }
  );

  it("drops the chip for an owner on Enterprise who has not turned it on", () => {
    expect(directoryNavEntry([org({ role: "OWNER", writable: true })])).toEqual({
      enterpriseChip: false,
    });
  });

  it("ignores the plan of an organization the viewer is only a member of", () => {
    expect(
      directoryNavEntry([
        org({ organizationId: "a", role: "ORGANIZATION_ADMIN", writable: false }),
        org({ organizationId: "b", role: "MEMBER", writable: true }),
      ])
    ).toEqual({ enterpriseChip: true });
  });
});

describe("directoryHome", () => {
  it("opens the Directory organization before one the viewer administers", () => {
    const home = directoryHome([
      org({ organizationId: "own", role: "OWNER" }),
      org({ organizationId: "work", enabled: true }),
    ]);
    expect(home?.organizationId).toBe("work");
  });

  it("opens the owned organization when none has the directory on", () => {
    const home = directoryHome([
      org({ organizationId: "delegate", role: "ORGANIZATION_ADMIN" }),
      org({ organizationId: "own", role: "OWNER" }),
    ]);
    expect(home?.organizationId).toBe("own");
  });

  it("opens nothing for a member without a Directory organization", () => {
    expect(directoryHome([org({})])).toBeNull();
  });
});

describe("administers", () => {
  it("returns true for the owner and an org admin", () => {
    expect(administers({ role: "OWNER" })).toBe(true);
    expect(administers({ role: "ORGANIZATION_ADMIN" })).toBe(true);
  });

  it("returns false for a member", () => {
    expect(administers({ role: "MEMBER" })).toBe(false);
  });
});
