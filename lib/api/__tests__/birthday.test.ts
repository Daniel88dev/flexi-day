import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import { deleteMyBirthday, getMyBirthday, putMyBirthday } from "../birthday";

describe("birthday api", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue(undefined);
  });

  it("getMyBirthday GETs the caller's birthday settings", async () => {
    await getMyBirthday();
    expect(apiMock).toHaveBeenCalledWith("/api/users/me/birthday");
  });

  it("putMyBirthday PUTs the whole birthday", async () => {
    await putMyBirthday({ month: 2, day: 29, year: null, shared: true });
    expect(apiMock).toHaveBeenCalledWith("/api/users/me/birthday", {
      method: "PUT",
      body: { month: 2, day: 29, year: null, shared: true },
    });
  });

  it("deleteMyBirthday DELETEs it", async () => {
    await deleteMyBirthday();
    expect(apiMock).toHaveBeenCalledWith("/api/users/me/birthday", { method: "DELETE" });
  });
});
