import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import {
  listOwnExportOrganizations,
  listRequestedExports,
  requestOwnPersonExport,
  requestPersonExport,
  signPersonExportDownload,
} from "../person-export";

describe("person export API", () => {
  beforeEach(() => apiMock.mockReset());

  it("requests an admin export through the Employment", async () => {
    apiMock.mockResolvedValue({ id: "x", status: "PENDING" });
    await requestPersonExport("emp 1");
    expect(apiMock).toHaveBeenCalledWith("/api/employment/emp%201/export", { method: "POST" });
  });

  it("lists the caller's requested exports for one organization", async () => {
    apiMock.mockResolvedValue([]);
    await listRequestedExports("org 1");
    expect(apiMock).toHaveBeenCalledWith("/api/employment/exports?organizationId=org%201");
  });

  it("returns the organizations of the caller's own exports", async () => {
    apiMock.mockResolvedValue({ organizations: [{ organizationId: "o" }] });
    await expect(listOwnExportOrganizations()).resolves.toEqual([{ organizationId: "o" }]);
    expect(apiMock).toHaveBeenCalledWith("/api/users/me/person-exports");
  });

  it("requests the caller's own export for one organization", async () => {
    apiMock.mockResolvedValue({ id: "x" });
    await requestOwnPersonExport("org-1");
    expect(apiMock).toHaveBeenCalledWith("/api/users/me/person-exports", {
      method: "POST",
      body: { organizationId: "org-1" },
    });
  });

  it("signs a download link for one export", async () => {
    apiMock.mockResolvedValue({ url: "https://s3/x", expiresAt: "2026-10-25T22:00:00Z" });
    await expect(signPersonExportDownload("exp-1")).resolves.toMatchObject({ url: "https://s3/x" });
    expect(apiMock).toHaveBeenCalledWith("/api/person-exports/exp-1/download", { method: "POST" });
  });
});
