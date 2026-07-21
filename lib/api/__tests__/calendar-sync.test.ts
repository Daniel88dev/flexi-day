import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import {
  createCalendarSync,
  deleteCalendarSync,
  getCalendarSync,
  listCalendarSyncs,
  regenerateCalendarSyncToken,
  updateCalendarSync,
  type CalendarSyncInput,
} from "../calendar-sync";
import { VacationKind } from "../types";

const input: CalendarSyncInput = {
  name: "My feed",
  scope: "TEAM",
  distinguishMine: true,
  teamIds: ["t1"],
  types: [{ type: VacationKind.Vacation, color: "violet", mineColor: "plum" }],
};

describe("calendar-sync api", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({ ok: true });
  });

  it("listCalendarSyncs GETs the collection", async () => {
    await listCalendarSyncs();
    expect(apiMock).toHaveBeenCalledWith("/api/calendar-sync");
  });

  it("getCalendarSync GETs a single config", async () => {
    await getCalendarSync("abc");
    expect(apiMock).toHaveBeenCalledWith("/api/calendar-sync/abc");
  });

  it("createCalendarSync POSTs the input", async () => {
    await createCalendarSync(input);
    expect(apiMock).toHaveBeenCalledWith("/api/calendar-sync", { method: "POST", body: input });
  });

  it("updateCalendarSync PUTs to the config id", async () => {
    await updateCalendarSync("abc", input);
    expect(apiMock).toHaveBeenCalledWith("/api/calendar-sync/abc", { method: "PUT", body: input });
  });

  it("deleteCalendarSync DELETEs the config", async () => {
    await deleteCalendarSync("abc");
    expect(apiMock).toHaveBeenCalledWith("/api/calendar-sync/abc", { method: "DELETE" });
  });

  it("regenerateCalendarSyncToken POSTs to the regenerate endpoint", async () => {
    await regenerateCalendarSyncToken("abc");
    expect(apiMock).toHaveBeenCalledWith("/api/calendar-sync/abc/regenerate-token", {
      method: "POST",
    });
  });
});
