import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import {
  acceptDirectoryAgreement,
  enableDirectory,
  getDirectoryState,
  listDirectoryOrganizations,
} from "../directory";

describe("directory API", () => {
  beforeEach(() => apiMock.mockReset());

  it("reads one organization's directory state", async () => {
    apiMock.mockResolvedValue({ enabled: false });
    await getDirectoryState("org 1");
    expect(apiMock).toHaveBeenCalledWith("/api/organization/directory?organizationId=org%201");
  });

  it("turns the directory on with the agreement version the owner saw", async () => {
    apiMock.mockResolvedValue({ enabled: true });
    await enableDirectory("org-1", 1);
    expect(apiMock).toHaveBeenCalledWith(
      "/api/organization/directory/enable?organizationId=org-1",
      { method: "POST", body: { agreementVersion: 1 } }
    );
  });

  it("accepts a new agreement version", async () => {
    apiMock.mockResolvedValue({ enabled: true });
    await acceptDirectoryAgreement("org-1", 2);
    expect(apiMock).toHaveBeenCalledWith(
      "/api/organization/directory/agreement?organizationId=org-1",
      { method: "POST", body: { agreementVersion: 2 } }
    );
  });

  it("lists the caller's directory organizations", async () => {
    apiMock.mockResolvedValue([]);
    await listDirectoryOrganizations();
    expect(apiMock).toHaveBeenCalledWith("/api/directory/organizations");
  });
});
