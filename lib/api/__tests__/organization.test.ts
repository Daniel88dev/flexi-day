import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import {
  addOrganizationAdmin,
  getOrganization,
  listOrganizationCandidates,
  listOrganizations,
  removeOrganizationAdmin,
  updateOrganization,
} from "../organization";

describe("organization api", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({ ok: true });
  });

  it("listOrganizations GETs the list endpoint", async () => {
    await listOrganizations();
    expect(apiMock).toHaveBeenCalledWith("/api/organization/list");
  });

  describe("addressing an organization", () => {
    it("omits the query entirely for the caller's own organization", async () => {
      await getOrganization();
      expect(apiMock).toHaveBeenCalledWith("/api/organization");

      await getOrganization(null);
      expect(apiMock).toHaveBeenLastCalledWith("/api/organization");
    });

    it("names the organization when one is given", async () => {
      await getOrganization("org-1");
      expect(apiMock).toHaveBeenCalledWith("/api/organization?organizationId=org-1");
    });

    it("encodes an id that needs it", async () => {
      await getOrganization("org 1&2");
      expect(apiMock).toHaveBeenCalledWith("/api/organization?organizationId=org%201%262");
    });
  });

  describe("updateOrganization", () => {
    it("PATCHes only the fields it was given", async () => {
      await updateOrganization({ name: "Acme Inc" });
      expect(apiMock).toHaveBeenCalledWith("/api/organization", {
        method: "PATCH",
        body: { name: "Acme Inc" },
      });
    });

    it("keeps the organization id in the query, not the body", async () => {
      await updateOrganization({ organizationId: "org-1", billingEmail: "b@acme.test" });
      expect(apiMock).toHaveBeenCalledWith("/api/organization?organizationId=org-1", {
        method: "PATCH",
        body: { billingEmail: "b@acme.test" },
      });
    });
  });

  it("listOrganizationCandidates GETs the candidates endpoint", async () => {
    await listOrganizationCandidates("org-1");
    expect(apiMock).toHaveBeenCalledWith("/api/organization/candidates?organizationId=org-1");
  });

  it("addOrganizationAdmin POSTs the target user", async () => {
    await addOrganizationAdmin({ userId: "u-2", organizationId: "org-1" });
    expect(apiMock).toHaveBeenCalledWith("/api/organization/admins?organizationId=org-1", {
      method: "POST",
      body: { userId: "u-2" },
    });
  });

  it("removeOrganizationAdmin DELETEs the target user", async () => {
    await removeOrganizationAdmin({ userId: "u-2" });
    expect(apiMock).toHaveBeenCalledWith("/api/organization/admins/u-2", { method: "DELETE" });
  });
});
