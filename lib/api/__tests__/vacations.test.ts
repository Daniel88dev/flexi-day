import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import {
  cancelVacation,
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
