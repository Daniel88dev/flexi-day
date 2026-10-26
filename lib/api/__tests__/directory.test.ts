import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import {
  acceptDirectoryAgreement,
  enableDirectory,
  getDirectoryProfile,
  getProfileHistory,
  updateDirectoryProfile,
  getDirectoryState,
  listDirectoryOrganizations,
  listDirectoryPeople,
  listFormerDirectoryPeople,
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

  it("reads the directory list, the Former list and one profile of an organization", async () => {
    apiMock.mockResolvedValue({});
    await listDirectoryPeople("org 1");
    await listFormerDirectoryPeople("org-1");
    await getDirectoryProfile("org-1", "emp/1");
    expect(apiMock.mock.calls.map(([path]) => path)).toEqual([
      "/api/directory/org%201/people",
      "/api/directory/org-1/former",
      "/api/directory/org-1/people/emp%2F1",
    ]);
  });

  it("sends a profile edit as a PATCH with the Sections it touches", async () => {
    apiMock.mockResolvedValue({});
    await updateDirectoryProfile("org-1", "emp/1", { card: { jobTitle: null } });
    expect(apiMock).toHaveBeenCalledWith("/api/directory/org-1/people/emp%2F1", {
      method: "PATCH",
      body: { card: { jobTitle: null } },
    });
  });

  it("reads a profile's history", async () => {
    apiMock.mockResolvedValue([]);
    await getProfileHistory("org-1", "emp-1");
    expect(apiMock).toHaveBeenCalledWith("/api/directory/org-1/people/emp-1/history");
  });
});
