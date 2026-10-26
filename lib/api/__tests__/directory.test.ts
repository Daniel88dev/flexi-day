import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import {
  acceptDirectoryAgreement,
  enableDirectory,
  getDirectoryProfile,
  getDirectoryRoles,
  getPermissionHistory,
  getPermissionTable,
  getProfileHistory,
  setDirectoryRoles,
  updatePermissionCell,
  updateDirectoryProfile,
  getDirectoryState,
  listDirectoryOrganizations,
  listDirectoryPeople,
  listFormerDirectoryPeople,
  getProfilePhotoUpload,
  removeProfilePhoto,
  startProfilePhotoUpload,
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

  it("reads the Permission table, its history and the Directory roles", async () => {
    apiMock.mockResolvedValue({});
    await getPermissionTable("org 1");
    await getPermissionHistory("org-1");
    await getDirectoryRoles("org-1");
    expect(apiMock.mock.calls.map(([path]) => path)).toEqual([
      "/api/directory/org%201/permissions",
      "/api/directory/org-1/permissions/history",
      "/api/directory/org-1/roles",
    ]);
  });

  it("changes one cell with a PATCH and sets a person's roles with a PUT", async () => {
    apiMock.mockResolvedValue({});
    await updatePermissionCell("org-1", { row: "JOB", audience: "HR", value: "READ" });
    await setDirectoryRoles("org-1", "emp/1", ["HR", "LEADERSHIP"]);
    expect(apiMock.mock.calls).toEqual([
      [
        "/api/directory/org-1/permissions",
        { method: "PATCH", body: { row: "JOB", audience: "HR", value: "READ" } },
      ],
      [
        "/api/directory/org-1/roles/emp%2F1",
        { method: "PUT", body: { roles: ["HR", "LEADERSHIP"] } },
      ],
    ]);
  });

  it("starts, follows and removes a Profile photo upload", async () => {
    apiMock.mockResolvedValue({});
    await startProfilePhotoUpload("org-1", "emp/1", { contentType: "image/jpeg", size: 12 });
    await getProfilePhotoUpload("org-1", "emp-1", "photo-1");
    await removeProfilePhoto("org-1", "emp-1");
    expect(apiMock.mock.calls).toEqual([
      [
        "/api/directory/org-1/people/emp%2F1/photo",
        { method: "POST", body: { contentType: "image/jpeg", size: 12 } },
      ],
      ["/api/directory/org-1/people/emp-1/photo/photo-1"],
      ["/api/directory/org-1/people/emp-1/photo", { method: "DELETE" }],
    ]);
  });
});
