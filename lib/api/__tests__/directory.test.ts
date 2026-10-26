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
  getEndPreview,
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
  showSensitiveSection,
  getReadLog,
  getDirectoryGeneralSettings,
  updateDirectoryGeneralSettings,
  getPreviousSpell,
  copyFromPreviousSpell,
  getDirectoryChecklist,
  hideDirectoryChecklist,
  changeWorkerType,
  checkDirectoryEmail,
  createDirectoryPerson,
  deleteAllDirectoryData,
  disableDirectory,
  getRetentionPreview,
  getRetentionSettings,
  sendDirectoryInvite,
  setRetentionHold,
  updateRetentionPeriod,
} from "../directory";

describe("directory API", () => {
  beforeEach(() => apiMock.mockReset());

  it("reads one organization's directory state", async () => {
    apiMock.mockResolvedValue({ enabled: false });
    await getDirectoryState("org 1");
    expect(apiMock).toHaveBeenCalledWith("/api/organization/directory?organizationId=org%201");
  });

  it("turns the directory on with the agreement version the owner saw and Tell members", async () => {
    apiMock.mockResolvedValue({ enabled: true });
    await enableDirectory("org-1", { agreementVersion: 1, tellMembers: true });
    expect(apiMock).toHaveBeenCalledWith(
      "/api/organization/directory/enable?organizationId=org-1",
      { method: "POST", body: { agreementVersion: 1, tellMembers: true } }
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

  it("reads what End would do to a record", async () => {
    apiMock.mockResolvedValue({});
    await getEndPreview("org-1", "emp-1");
    expect(apiMock).toHaveBeenCalledWith("/api/directory/org-1/people/emp-1/end-preview");
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

  it("shows one Sensitive section with a POST, in the asked language", async () => {
    apiMock.mockResolvedValue({});
    await showSensitiveSection("org-1", "emp/1", "contact", "cs");
    expect(apiMock).toHaveBeenCalledWith(
      "/api/directory/org-1/people/emp%2F1/show/contact?language=cs",
      {
        method: "POST",
      }
    );
  });

  it("reads the read log with only the filters given", async () => {
    apiMock.mockResolvedValue({});
    await getReadLog("org-1");
    await getReadLog("org-1", { employmentId: "emp-1", readerUserId: "u-1", before: "r-9" });
    expect(apiMock.mock.calls).toEqual([
      ["/api/directory/org-1/read-log"],
      ["/api/directory/org-1/read-log?employmentId=emp-1&readerUserId=u-1&before=r-9"],
    ]);
  });

  it("reads and saves the General settings", async () => {
    apiMock.mockResolvedValue({});
    await getDirectoryGeneralSettings("org-1");
    await updateDirectoryGeneralSettings("org-1", { en: "Text", cs: null });
    expect(apiMock.mock.calls).toEqual([
      ["/api/directory/org-1/settings/general"],
      [
        "/api/directory/org-1/settings/general",
        { method: "PUT", body: { emergencyContactNotice: { en: "Text", cs: null } } },
      ],
    ]);
  });

  it("reads the previous spell and copies the chosen Sections with a POST", async () => {
    apiMock.mockResolvedValue({});
    await getPreviousSpell("org-1", "emp/2");
    await copyFromPreviousSpell("org-1", "emp/2", ["contact", "photo"], "cs");
    expect(apiMock.mock.calls).toEqual([
      ["/api/directory/org-1/people/emp%2F2/previous-spell"],
      [
        "/api/directory/org-1/people/emp%2F2/previous-spell/copy?language=cs",
        { method: "POST", body: { sections: ["contact", "photo"] } },
      ],
    ]);
  });

  it("reads the setup checklist and hides it with a POST", async () => {
    apiMock.mockResolvedValue({});
    await getDirectoryChecklist("org 1");
    await hideDirectoryChecklist("org 1");
    expect(apiMock.mock.calls).toEqual([
      ["/api/directory/org%201/checklist"],
      ["/api/directory/org%201/checklist/hide", { method: "POST" }],
    ]);
  });

  it("turns the directory off and deletes its data with the typed name", async () => {
    apiMock.mockResolvedValue({ enabled: false });
    await disableDirectory("org 1");
    await deleteAllDirectoryData("org-1", "Acme");
    expect(apiMock.mock.calls).toEqual([
      ["/api/organization/directory/disable?organizationId=org%201", { method: "POST" }],
      [
        "/api/organization/directory/delete-all?organizationId=org-1",
        { method: "POST", body: { confirmName: "Acme" } },
      ],
    ]);
  });

  it("adds a person without an account, in the asked language", async () => {
    apiMock.mockResolvedValue({});
    await createDirectoryPerson("org-1", { name: "Ada", type: "employee" }, "cs");
    await createDirectoryPerson("org-1", { name: "Bo", type: "external" });
    expect(apiMock.mock.calls).toEqual([
      [
        "/api/directory/org-1/people?language=cs",
        { method: "POST", body: { name: "Ada", type: "employee" } },
      ],
      ["/api/directory/org-1/people", { method: "POST", body: { name: "Bo", type: "external" } }],
    ]);
  });

  it("sends a directory invite to an encoded Employment, with or without a group", async () => {
    apiMock.mockResolvedValue({});
    await sendDirectoryInvite("org-1", "emp/1", "g-1");
    await sendDirectoryInvite("org-1", "emp-2", null);
    expect(apiMock.mock.calls).toEqual([
      ["/api/directory/org-1/people/emp%2F1/invite", { method: "POST", body: { groupId: "g-1" } }],
      ["/api/directory/org-1/people/emp-2/invite", { method: "POST", body: {} }],
    ]);
  });

  it("checks an email in the body, never in the path", async () => {
    apiMock.mockResolvedValue({ available: true });
    await checkDirectoryEmail("org-1", "ada@example.com");
    expect(apiMock).toHaveBeenCalledWith("/api/directory/org-1/people/email-check", {
      method: "POST",
      body: { email: "ada@example.com" },
    });
  });

  it("changes the worker type with a PUT, in the asked language", async () => {
    apiMock.mockResolvedValue({});
    await changeWorkerType("org-1", "emp/1", "external", "en");
    expect(apiMock).toHaveBeenCalledWith(
      "/api/directory/org-1/people/emp%2F1/worker-type?language=en",
      { method: "PUT", body: { type: "external" } }
    );
  });

  it("reads and changes the retention periods, and previews a change", async () => {
    apiMock.mockResolvedValue({});
    await getRetentionSettings("org-1");
    await updateRetentionPeriod("org-1", { section: "CONTACT", period: "YEAR_1" });
    await getRetentionPreview("org-1", { section: "JOB", period: "AT_END" });
    expect(apiMock.mock.calls).toEqual([
      ["/api/directory/org-1/settings/retention"],
      [
        "/api/directory/org-1/settings/retention",
        { method: "PUT", body: { section: "CONTACT", period: "YEAR_1" } },
      ],
      ["/api/directory/org-1/settings/retention/preview?section=JOB&period=AT_END"],
    ]);
  });

  it("sets the Retention hold with a PUT and lifts it with a DELETE", async () => {
    apiMock.mockResolvedValue({ hold: null });
    await setRetentionHold("org-1", "emp/1", true);
    await setRetentionHold("org-1", "emp/1", false);
    expect(apiMock.mock.calls).toEqual([
      ["/api/directory/org-1/people/emp%2F1/hold", { method: "PUT" }],
      ["/api/directory/org-1/people/emp%2F1/hold", { method: "DELETE" }],
    ]);
  });
});
