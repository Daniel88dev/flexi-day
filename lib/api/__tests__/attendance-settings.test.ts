import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import { getAttendanceSettings, updateAttendanceSettings } from "../attendance-settings";

describe("attendance settings api", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({});
  });

  it("getAttendanceSettings GETs the caller's own organization when none is named", async () => {
    await getAttendanceSettings();
    expect(apiMock).toHaveBeenCalledWith("/api/organization/attendance-settings");
  });

  it("getAttendanceSettings scopes the request to a named organization", async () => {
    await getAttendanceSettings("org 1");
    expect(apiMock).toHaveBeenCalledWith(
      "/api/organization/attendance-settings?organizationId=org%201"
    );
  });

  it("updateAttendanceSettings PUTs the rules with the organization in the query only", async () => {
    await updateAttendanceSettings({
      organizationId: "org-1",
      attendanceEnabled: true,
      timezone: "Europe/Prague",
      breakMinutes: 45,
    });

    expect(apiMock).toHaveBeenCalledWith(
      "/api/organization/attendance-settings?organizationId=org-1",
      {
        method: "PUT",
        body: { attendanceEnabled: true, timezone: "Europe/Prague", breakMinutes: 45 },
      }
    );
  });
});
