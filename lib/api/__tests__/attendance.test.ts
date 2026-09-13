import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import {
  clockIn,
  clockOut,
  correctBreak,
  correctSession,
  endBreak,
  getAttendanceDay,
  getAttendanceState,
  getSessionEvents,
  getTeamAttendance,
  removeBreak,
  removeSession,
  startBreak,
} from "../attendance";

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

describe("getTeamAttendance", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({});
  });

  it("names the organization and the range, and the group only when there is one", async () => {
    await getTeamAttendance({ organizationId: "org 1", from: "2026-09-07", to: "2026-09-13" });
    expect(apiMock).toHaveBeenCalledWith(
      "/api/attendance/team?organizationId=org+1&from=2026-09-07&to=2026-09-13"
    );

    await getTeamAttendance({
      organizationId: "org-1",
      from: "2026-09-07",
      to: "2026-09-13",
      groupId: "eng",
    });
    expect(apiMock).toHaveBeenLastCalledWith(
      "/api/attendance/team?organizationId=org-1&from=2026-09-07&to=2026-09-13&groupId=eng"
    );

    await getTeamAttendance({
      organizationId: "org-1",
      from: "2026-09-07",
      to: "2026-09-13",
      groupId: null,
    });
    expect(apiMock).toHaveBeenLastCalledWith(
      "/api/attendance/team?organizationId=org-1&from=2026-09-07&to=2026-09-13"
    );
  });
});

describe("the correction endpoints", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({ events: [] });
  });

  it("getAttendanceDay names the organization and the date, and the person only for an admin", async () => {
    await getAttendanceDay({ organizationId: "org 1", businessDate: "2026-09-09" });
    expect(apiMock).toHaveBeenCalledWith(
      "/api/attendance/day?organizationId=org+1&businessDate=2026-09-09"
    );

    await getAttendanceDay({
      organizationId: "org-1",
      businessDate: "2026-09-09",
      userId: "user-2",
    });
    expect(apiMock).toHaveBeenLastCalledWith(
      "/api/attendance/day?organizationId=org-1&businessDate=2026-09-09&userId=user-2"
    );
  });

  it("getSessionEvents unwraps the timeline from its envelope", async () => {
    apiMock.mockResolvedValue({ sessionId: "s 1", events: [{ id: "event-1" }] });

    await expect(getSessionEvents("s 1")).resolves.toEqual([{ id: "event-1" }]);
    expect(apiMock).toHaveBeenCalledWith("/api/attendance/sessions/s%201/events");
  });

  it("patches a session and a break with the same shape", async () => {
    await correctSession("s 1", { endedAt: "2026-09-09T15:10:00.000Z" });
    expect(apiMock).toHaveBeenCalledWith("/api/attendance/sessions/s%201", {
      method: "PATCH",
      body: { endedAt: "2026-09-09T15:10:00.000Z" },
    });

    await correctBreak("b 1", { endedAt: null });
    expect(apiMock).toHaveBeenLastCalledWith("/api/attendance/breaks/b%201", {
      method: "PATCH",
      body: { endedAt: null },
    });
  });

  it("deletes a break and a session", async () => {
    await removeBreak("b 1");
    expect(apiMock).toHaveBeenCalledWith("/api/attendance/breaks/b%201", { method: "DELETE" });

    await removeSession("s 1");
    expect(apiMock).toHaveBeenLastCalledWith("/api/attendance/sessions/s%201", {
      method: "DELETE",
    });
  });
});
