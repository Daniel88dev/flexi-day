import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import { createGroup, listGroups, updateGroupQuotas } from "../groups";

describe("groups api", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({});
  });

  it("listGroups GETs the collection", async () => {
    await listGroups();
    expect(apiMock).toHaveBeenCalledWith("/api/group");
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
});
