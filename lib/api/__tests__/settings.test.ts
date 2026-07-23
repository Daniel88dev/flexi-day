import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import { getMySettings, updateMySettings } from "../settings";

describe("settings api", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({ emailNotifications: true });
  });

  it("getMySettings GETs the caller's settings", async () => {
    await getMySettings();
    expect(apiMock).toHaveBeenCalledWith("/api/users/me/settings");
  });

  it("updateMySettings PUTs the flags", async () => {
    await updateMySettings({ emailNotifications: false });
    expect(apiMock).toHaveBeenCalledWith("/api/users/me/settings", {
      method: "PUT",
      body: { emailNotifications: false },
    });
  });
});
