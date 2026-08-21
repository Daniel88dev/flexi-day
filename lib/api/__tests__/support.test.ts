import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import {
  getSupportGroup,
  getSupportOrganization,
  opaqueSearchKey,
  searchSupportOrganizations,
} from "../support";

describe("support api", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({});
  });

  it("searchSupportOrganizations GETs without a query param when empty", async () => {
    await searchSupportOrganizations();
    expect(apiMock).toHaveBeenCalledWith("/api/support/organizations");
    apiMock.mockClear();
    await searchSupportOrganizations("   ");
    expect(apiMock).toHaveBeenCalledWith("/api/support/organizations");
  });

  it("searchSupportOrganizations encodes the trimmed query", async () => {
    await searchSupportOrganizations(" acme & co ");
    expect(apiMock).toHaveBeenCalledWith("/api/support/organizations?query=acme%20%26%20co");
  });

  it("getSupportOrganization GETs the organization by id", async () => {
    await getSupportOrganization("org-1");
    expect(apiMock).toHaveBeenCalledWith("/api/support/organizations/org-1");
  });

  it("getSupportGroup GETs the group by id", async () => {
    await getSupportGroup("group-1");
    expect(apiMock).toHaveBeenCalledWith("/api/support/groups/group-1");
  });
});

describe("opaqueSearchKey", () => {
  it("never contains the raw term and is stable per input", () => {
    const key = opaqueSearchKey("jane@acme.com");
    expect(key).not.toContain("jane");
    expect(key).not.toContain("@");
    expect(key).toMatch(/^[0-9a-z]+$/);
    expect(opaqueSearchKey("jane@acme.com")).toBe(key);
    expect(opaqueSearchKey("john@acme.com")).not.toBe(key);
    expect(opaqueSearchKey("")).toMatch(/^[0-9a-z]+$/);
  });
});
