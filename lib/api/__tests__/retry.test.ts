import { describe, expect, it } from "vitest";
import { shouldRetryQuery } from "../retry";
import { ApiError } from "../client";

describe("shouldRetryQuery", () => {
  it("never retries a 429, so a rejected request cannot double the load", () => {
    expect(shouldRetryQuery(0, new ApiError(429, "Too many requests"))).toBe(false);
  });

  it("does not retry other 4xx responses", () => {
    for (const status of [400, 401, 403, 404, 422]) {
      expect(shouldRetryQuery(0, new ApiError(status, "nope"))).toBe(false);
    }
  });

  it("retries a 5xx once", () => {
    expect(shouldRetryQuery(0, new ApiError(503, "unavailable"))).toBe(true);
    expect(shouldRetryQuery(1, new ApiError(503, "unavailable"))).toBe(false);
  });

  it("retries a network failure once", () => {
    expect(shouldRetryQuery(0, new TypeError("Failed to fetch"))).toBe(true);
    expect(shouldRetryQuery(1, new TypeError("Failed to fetch"))).toBe(false);
  });
});
