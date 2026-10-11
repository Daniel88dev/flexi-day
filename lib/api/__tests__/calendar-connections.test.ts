import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../client")>()),
  api: (...args: unknown[]) => apiMock(...args),
}));

import { ApiError } from "../client";
import {
  calendarConnectionError,
  disconnectCalendar,
  listConnections,
  providerSlug,
  removeCalendarTarget,
  setCalendarTarget,
  startConnection,
  syncCalendarNow,
} from "../calendar-connections";

beforeEach(() => {
  apiMock.mockReset();
  apiMock.mockResolvedValue({ ok: true });
});

describe("listConnections", () => {
  it("returns the caller's connections and enabled providers from the collection", async () => {
    const body = {
      providers: { google: true, microsoft: false },
      connections: [
        { provider: "GOOGLE", status: "ACTIVE", capability: "STATUS", createdAt: "2026-10-01" },
      ],
    };
    apiMock.mockResolvedValue(body);

    await expect(listConnections()).resolves.toEqual(body);
    expect(apiMock).toHaveBeenCalledWith("/api/calendar-sync/connections");
  });
});

describe("startConnection", () => {
  it("returns the consent url after POSTing the config and zone", async () => {
    apiMock.mockResolvedValue({ url: "https://accounts.google.com/o/oauth2/auth?state=s" });

    const result = await startConnection("google", {
      configId: "cfg-1",
      timeZone: "Europe/Prague",
    });

    expect(result).toEqual({ url: "https://accounts.google.com/o/oauth2/auth?state=s" });
    expect(apiMock).toHaveBeenCalledWith("/api/calendar-sync/connections/google/start", {
      method: "POST",
      body: { configId: "cfg-1", timeZone: "Europe/Prague" },
    });
  });
});

describe("disconnectCalendar", () => {
  it("returns the backend's answer after DELETEing the provider's connection", async () => {
    apiMock.mockResolvedValue({ message: "Calendar disconnected" });

    await expect(disconnectCalendar("microsoft")).resolves.toEqual({
      message: "Calendar disconnected",
    });
    expect(apiMock).toHaveBeenCalledWith("/api/calendar-sync/connections/microsoft", {
      method: "DELETE",
    });
  });
});

describe("setCalendarTarget", () => {
  it("returns the config after PUTting the time zone to its target", async () => {
    apiMock.mockResolvedValue({ id: "cfg-1" });

    await expect(setCalendarTarget("cfg-1", { timeZone: "America/New_York" })).resolves.toEqual({
      id: "cfg-1",
    });
    expect(apiMock).toHaveBeenCalledWith("/api/calendar-sync/cfg-1/target", {
      method: "PUT",
      body: { timeZone: "America/New_York" },
    });
  });
});

describe("removeCalendarTarget", () => {
  it("returns the backend's answer after DELETEing the config's target", async () => {
    apiMock.mockResolvedValue({ message: "Direct sync turned off" });

    await expect(removeCalendarTarget("cfg-1")).resolves.toEqual({
      message: "Direct sync turned off",
    });
    expect(apiMock).toHaveBeenCalledWith("/api/calendar-sync/cfg-1/target", { method: "DELETE" });
  });
});

describe("syncCalendarNow", () => {
  it("returns the config after POSTing to the target's sync endpoint", async () => {
    apiMock.mockResolvedValue({ id: "cfg-1" });

    await expect(syncCalendarNow("cfg-1")).resolves.toEqual({ id: "cfg-1" });
    expect(apiMock).toHaveBeenCalledWith("/api/calendar-sync/cfg-1/target/sync", {
      method: "POST",
    });
  });
});

describe("providerSlug", () => {
  it("returns the path slug for each provider the API names", () => {
    expect(providerSlug("GOOGLE")).toBe("google");
    expect(providerSlug("MICROSOFT")).toBe("microsoft");
  });
});

const apiError = (status: number, message: string, context?: Record<string, unknown>) =>
  new ApiError(status, message, undefined, [{ message, context }]);

describe("calendarConnectionError", () => {
  it.each([
    [
      "team_config",
      apiError(400, "Only a calendar with your own records can sync to a connected account", {
        code: "CALENDAR_SYNC_TEAM_SCOPE",
      }),
    ],
    [
      "not_entitled",
      apiError(402, "Direct calendar sync requires a paid plan", {
        reason: "PLAN_LIMIT",
        code: "CALENDAR_SYNC_PLAN_REQUIRED",
      }),
    ],
    [
      "provider_disabled",
      apiError(404, "This calendar provider is not available", {
        code: "CALENDAR_SYNC_PROVIDER_OFF",
      }),
    ],
    [
      "needs_reconnect",
      apiError(409, "Reconnect the calendar account before syncing", {
        code: "CALENDAR_SYNC_NEEDS_RECONNECT",
      }),
    ],
    [
      "target_exists",
      apiError(409, "This calendar already syncs to another account; turn that off first", {
        code: "CALENDAR_SYNC_TARGET_EXISTS",
      }),
    ],
  ])("returns %s for the backend's error code", (name, error) => {
    expect(calendarConnectionError(error)).toBe(name);
  });

  it("returns provider_disabled for the provider-off 404 that carries no code yet", () => {
    expect(calendarConnectionError(apiError(404, "This calendar provider is not available"))).toBe(
      "provider_disabled"
    );
  });

  it("returns unknown for a 404 that is not the provider switch", () => {
    expect(calendarConnectionError(apiError(404, "Calendar not found"))).toBe("unknown");
  });

  it("returns unknown for another plan limit", () => {
    expect(
      calendarConnectionError(apiError(402, "Upgrade", { reason: "PLAN_LIMIT", limit: 3 }))
    ).toBe("unknown");
  });

  it("returns unknown for a code it does not map", () => {
    expect(calendarConnectionError(apiError(400, "Nope", { code: "SOMETHING_ELSE" }))).toBe(
      "unknown"
    );
    expect(calendarConnectionError(apiError(400, "Nope", { code: "toString" }))).toBe("unknown");
    expect(
      calendarConnectionError(
        apiError(400, "Invalid state", { code: "CALENDAR_SYNC_STATE_INVALID" })
      )
    ).toBe("unknown");
  });

  it("returns unknown for an error that is not from the API", () => {
    expect(calendarConnectionError(new TypeError("Failed to fetch"))).toBe("unknown");
    expect(calendarConnectionError(undefined)).toBe("unknown");
  });
});
