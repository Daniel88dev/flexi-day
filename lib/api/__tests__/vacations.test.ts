import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import {
  cancelVacations,
  createVacation,
  getVacation,
  listVacations,
  rejectVacation,
  approveVacations,
  updateVacation,
} from "../vacations";
import { CalendarRecordType, vacationStatus, type Vacation } from "../types";

describe("vacations api", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({});
  });

  it("listVacations passes year and month as query params", async () => {
    await listVacations({ year: 2026, month: 8 });
    expect(apiMock).toHaveBeenCalledWith("/api/vacation?year=2026&month=8");
  });

  it("listVacations asks for a group's records when a groupId is given", async () => {
    await listVacations({ year: 2026, month: 8, groupId: "g-1" });
    expect(apiMock).toHaveBeenCalledWith("/api/vacation?year=2026&month=8&groupId=g-1");
  });

  it("listVacations omits a null groupId so the caller's own records come back", async () => {
    await listVacations({ year: 2026, month: 8, groupId: null });
    expect(apiMock).toHaveBeenCalledWith("/api/vacation?year=2026&month=8");
  });

  it("getVacation GETs a single request", async () => {
    await getVacation("v-1");
    expect(apiMock).toHaveBeenCalledWith("/api/vacation/v-1");
  });

  it("cancelVacations posts the id list, omitting reason when absent", async () => {
    await cancelVacations(["v-1", "v-2"]);
    expect(apiMock).toHaveBeenCalledWith("/api/vacation/cancel", {
      method: "POST",
      body: { ids: ["v-1", "v-2"] },
    });
  });

  it("cancelVacations posts ids and reason when given", async () => {
    await cancelVacations(["v-1", "v-2"], "Plans changed");
    expect(apiMock).toHaveBeenCalledWith("/api/vacation/cancel", {
      method: "POST",
      body: { ids: ["v-1", "v-2"], reason: "Plans changed" },
    });
  });

  it("rejectVacation posts the reason when given", async () => {
    await rejectVacation("v-1", "Too many out that week");
    expect(apiMock).toHaveBeenCalledWith("/api/vacation/reject/v-1", {
      method: "POST",
      body: { reason: "Too many out that week" },
    });
  });

  it("approveVacations posts the whole id array", async () => {
    await approveVacations(["v-1", "v-2"]);
    expect(apiMock).toHaveBeenCalledWith("/api/vacation/approve", {
      method: "POST",
      body: { ids: ["v-1", "v-2"] },
    });
  });

  it("listVacations opts into cancelled rows only when asked", async () => {
    await listVacations({ year: 2026, month: 8, includeCancelled: true });
    expect(apiMock).toHaveBeenCalledWith("/api/vacation?year=2026&month=8&includeCancelled=true");

    apiMock.mockClear();
    await listVacations({ year: 2026, month: 8, includeCancelled: false });
    expect(apiMock).toHaveBeenCalledWith("/api/vacation?year=2026&month=8");
  });

  it("createVacation passes on-behalf fields through untouched", async () => {
    await createVacation({
      groupId: "g-1",
      userId: "u-member",
      from: "2026-08-20",
      to: "2026-08-20",
      autoApprove: true,
    });
    expect(apiMock).toHaveBeenCalledWith("/api/vacation/create-vacation", {
      method: "POST",
      body: {
        groupId: "g-1",
        userId: "u-member",
        from: "2026-08-20",
        to: "2026-08-20",
        autoApprove: true,
      },
    });
  });

  it("updateVacation PATCHes the collection with ids and the changed fields", async () => {
    await updateVacation({
      ids: ["v-1", "v-2"],
      vacationType: CalendarRecordType.Sick,
      halfDay: true,
    });
    expect(apiMock).toHaveBeenCalledWith("/api/vacation", {
      method: "PATCH",
      body: { ids: ["v-1", "v-2"], vacationType: CalendarRecordType.Sick, halfDay: true },
    });
  });
});

describe("vacationStatus", () => {
  const base = {
    approvedAt: null,
    rejectedAt: null,
    deletedAt: null,
  } as Vacation;

  it("returns cancelled even when the row was approved first", () => {
    expect(
      vacationStatus({
        ...base,
        approvedAt: "2026-08-01T00:00:00Z",
        deletedAt: "2026-08-02T00:00:00Z",
      })
    ).toBe("cancelled");
  });

  it("keeps the existing three-state derivation for live rows", () => {
    expect(vacationStatus(base)).toBe("pending");
    expect(vacationStatus({ ...base, approvedAt: "2026-08-01T00:00:00Z" })).toBe("approved");
    expect(vacationStatus({ ...base, rejectedAt: "2026-08-01T00:00:00Z" })).toBe("rejected");
  });
});
