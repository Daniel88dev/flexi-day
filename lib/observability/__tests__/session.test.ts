import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
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

  it("returns the same session id on repeated calls", () => {
    const first = getSessionId();
    expect(first).toBeTruthy();
    expect(getSessionId()).toBe(first);
  });

  it("mints a new session id in a new tab", () => {
    const session = getSessionId();

    // A new tab: sessionStorage is empty.
    window.sessionStorage.clear();
    __resetIdCacheForTests();

    expect(getSessionId()).not.toBe(session);
  });

  it("persists the session id under its storage key", () => {
    const session = getSessionId();

    expect(window.sessionStorage.getItem("fd.sid")).toBe(session);
  });

  it("writes nothing to localStorage", () => {
    getSessionId();
    correlationHeaders();

    expect(window.localStorage.length).toBe(0);
  });

  it("falls back to an in-memory id when storage throws (Safari private mode)", () => {
    vi.spyOn(window.sessionStorage, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    const id = getSessionId();

    expect(id).toBeTruthy();
    // Still stable for the life of the page even though nothing was persisted.
    expect(getSessionId()).toBe(id);
  });

  it("builds the outbound correlation headers", () => {
    const headers = correlationHeaders();

    expect(headers).toEqual({
      "x-client-session-id": getSessionId(),
    });
  });
});
