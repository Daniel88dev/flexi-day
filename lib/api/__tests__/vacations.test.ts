import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import {
  cancelVacation,
  cancelVacations,
  getVacation,
  listVacations,
  rejectVacation,
  approveVacations,
} from "../vacations";

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

  it("cancelVacation sends no body when no reason is given", async () => {
    await cancelVacation("v-1");
    expect(apiMock).toHaveBeenCalledWith("/api/vacation/v-1", {
      method: "DELETE",
      body: undefined,
    });
  });

  it("cancelVacation sends the reason when given", async () => {
    await cancelVacation("v-1", "Trip called off");
    expect(apiMock).toHaveBeenCalledWith("/api/vacation/v-1", {
      method: "DELETE",
      body: { reason: "Trip called off" },
    });
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
});
