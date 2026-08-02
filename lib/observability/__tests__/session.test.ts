import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getDeviceId,
  getSessionId,
  correlationHeaders,
  __resetIdCacheForTests,
} from "@/lib/observability/session";

describe("session correlation ids", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    __resetIdCacheForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the same device id on repeated calls", () => {
    const first = getDeviceId();
    expect(first).toBeTruthy();
    expect(getDeviceId()).toBe(first);
  });

  it("returns the same session id on repeated calls", () => {
    const first = getSessionId();
    expect(first).toBeTruthy();
    expect(getSessionId()).toBe(first);
  });

  it("keeps the device id across sessions but mints a new session id", () => {
    const device = getDeviceId();
    const session = getSessionId();

    // A new tab: sessionStorage is empty, localStorage is not.
    window.sessionStorage.clear();
    __resetIdCacheForTests();

    expect(getDeviceId()).toBe(device);
    expect(getSessionId()).not.toBe(session);
  });

  it("persists the ids under their storage keys", () => {
    const device = getDeviceId();
    const session = getSessionId();

    expect(window.localStorage.getItem("fd.did")).toBe(device);
    expect(window.sessionStorage.getItem("fd.sid")).toBe(session);
  });

  it("gives the device and session distinct ids", () => {
    expect(getDeviceId()).not.toBe(getSessionId());
  });

  it("falls back to an in-memory id when storage throws (Safari private mode)", () => {
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    const id = getDeviceId();

    expect(id).toBeTruthy();
    // Still stable for the life of the page even though nothing was persisted.
    expect(getDeviceId()).toBe(id);
  });

  it("builds the outbound correlation headers", () => {
    const headers = correlationHeaders();

    expect(headers).toEqual({
      "x-client-session-id": getSessionId(),
      "x-client-device-id": getDeviceId(),
    });
  });
});
