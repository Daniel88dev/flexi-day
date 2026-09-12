import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import { clockIn, clockOut, endBreak, getAttendanceState, startBreak } from "../attendance";

describe("attendance api", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({});
  });

  it("getAttendanceState reads the caller's own Employment when none is named", async () => {
    await getAttendanceState();
    expect(apiMock).toHaveBeenCalledWith("/api/attendance/current");
  });

  it("getAttendanceState scopes the read to a named organization", async () => {
    await getAttendanceState("org 1");
    expect(apiMock).toHaveBeenCalledWith("/api/attendance/current?organizationId=org%201");
  });

  it.each([
    ["clockIn", clockIn, "clock-in"],
    ["clockOut", clockOut, "clock-out"],
    ["startBreak", startBreak, "break/start"],
    ["endBreak", endBreak, "break/end"],
  ])("%s posts to its own path with the organization in the body", async (_name, send, path) => {
    await send("org-1");
    expect(apiMock).toHaveBeenCalledWith(`/api/attendance/${path}`, {
      method: "POST",
      body: { organizationId: "org-1" },
    });
  });

  it("posts an empty body rather than a null organization", async () => {
    await clockIn();
    expect(apiMock).toHaveBeenCalledWith("/api/attendance/clock-in", {
      method: "POST",
      body: {},
    });
  });
});
