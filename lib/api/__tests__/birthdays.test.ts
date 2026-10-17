import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import { listBirthdays } from "../birthdays";

describe("listBirthdays", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue([]);
  });

  it("asks for the caller's own birthdays without a group", async () => {
    await listBirthdays({ year: 2027, month: 2, groupId: null });
    expect(apiMock).toHaveBeenCalledWith("/api/birthdays?year=2027&month=2");
  });

  it("asks for a group's birthdays with its id", async () => {
    await listBirthdays({ year: 2026, month: 10, groupId: "g-1" });
    expect(apiMock).toHaveBeenCalledWith("/api/birthdays?year=2026&month=10&groupId=g-1");
  });
});
