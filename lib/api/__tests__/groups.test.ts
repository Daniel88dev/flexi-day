import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import {
  createGroup,
  getGroup,
  listGroups,
  updateGroupHolidayCountry,
  updateGroupQuotas,
  updateGroupWorkingDays,
} from "../groups";

describe("groups api", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({});
  });

  it("listGroups GETs the collection", async () => {
    await listGroups();
    expect(apiMock).toHaveBeenCalledWith("/api/group");
  });

  it("getGroup GETs one group", async () => {
    await getGroup("g-1");
    expect(apiMock).toHaveBeenCalledWith("/api/group/g-1");
  });

  it("createGroup POSTs the input", async () => {
    await createGroup({ groupName: "Platform" });
    expect(apiMock).toHaveBeenCalledWith("/api/group", {
      method: "POST",
      body: { groupName: "Platform" },
    });
  });

  it("updateGroupQuotas PUTs the defaults with the groupId in the path only", async () => {
    await updateGroupQuotas({
      groupId: "g-1",
      defaultVacationDays: 25,
      defaultHomeOfficeDays: 60,
    });
    expect(apiMock).toHaveBeenCalledWith("/api/group/g-1/quotas", {
      method: "PUT",
      body: { defaultVacationDays: 25, defaultHomeOfficeDays: 60 },
    });
  });

  it("updateGroupWorkingDays PUTs the days with the groupId in the path only", async () => {
    await updateGroupWorkingDays({ groupId: "g-1", workingDays: [1, 2, 3, 4, 5] });
    expect(apiMock).toHaveBeenCalledWith("/api/group/g-1/working-days", {
      method: "PUT",
      body: { workingDays: [1, 2, 3, 4, 5] },
    });
  });

  it("updateGroupHolidayCountry PUTs the country with the groupId in the path only", async () => {
    await updateGroupHolidayCountry({ groupId: "g-1", holidayCountry: "CZ" });
    expect(apiMock).toHaveBeenCalledWith("/api/group/g-1/holiday-country", {
      method: "PUT",
      body: { holidayCountry: "CZ" },
    });
  });

  it("updateGroupHolidayCountry PUTs null to disable holidays", async () => {
    await updateGroupHolidayCountry({ groupId: "g-1", holidayCountry: null });
    expect(apiMock).toHaveBeenCalledWith("/api/group/g-1/holiday-country", {
      method: "PUT",
      body: { holidayCountry: null },
    });
  });
});
