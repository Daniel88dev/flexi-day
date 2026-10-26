import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import { endEmployment, eraseEmployment } from "../employment";

describe("endEmployment", () => {
  beforeEach(() => apiMock.mockReset());

  it("posts the last day of the spell to the Employment's end route", async () => {
    apiMock.mockResolvedValue({ id: "emp 1", ended: true, cancelledBookings: 2 });

    await endEmployment("emp 1", "2026-10-24");

    expect(apiMock).toHaveBeenCalledWith("/api/employment/emp%201/end", {
      method: "POST",
      body: { endedOn: "2026-10-24" },
    });
  });
});

describe("eraseEmployment", () => {
  beforeEach(() => apiMock.mockReset());

  it("posts the typed name to the Employment's erase route", async () => {
    apiMock.mockResolvedValue(undefined);

    await eraseEmployment("emp 1", "Jana Nováková");

    expect(apiMock).toHaveBeenCalledWith("/api/employment/emp%201/erase", {
      method: "POST",
      body: { confirmName: "Jana Nováková" },
    });
  });
});
