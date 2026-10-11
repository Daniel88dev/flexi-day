import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, api, errorCode } from "../client";

function mockFetchOnce(status: number, body: unknown) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(text, {
          status,
          headers: { "Content-Type": "application/json" },
        })
    )
  );
}

describe("api client error parsing", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses { errors: [{ message }] } shape (BE AppError middleware)", async () => {
    mockFetchOnce(403, { errors: [{ message: "Forbidden" }] });
    await expect(api("/x")).rejects.toMatchObject({
      status: 403,
      message: "Forbidden",
      errors: [{ message: "Forbidden" }],
    });
  });

  it("preserves context on conflict (409) when middleware forwards it", async () => {
    mockFetchOnce(409, {
      errors: [
        {
          message: "One or more days in the requested range are already booked",
          context: { conflictingDays: ["2026-06-08", "2026-06-09"], requested: 3, inserted: 1 },
        },
      ],
    });
    try {
      await api("/x");
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const e = err as ApiError;
      expect(e.status).toBe(409);
      expect(e.context<{ conflictingDays: string[] }>()).toEqual({
        conflictingDays: ["2026-06-08", "2026-06-09"],
        requested: 3,
        inserted: 1,
      });
    }
  });

  it("falls back to status text when body is empty", async () => {
    mockFetchOnce(500, "");
    await expect(api("/x")).rejects.toMatchObject({ status: 500 });
  });
});

describe("errorCode", () => {
  it("returns the code from the first error's context", () => {
    const error = new ApiError(409, "Taken", undefined, [
      { message: "Taken", context: { code: "INVITE_USED" } },
    ]);
    expect(errorCode(error)).toBe("INVITE_USED");
  });

  it("returns undefined when the context carries no string code", () => {
    expect(errorCode(new ApiError(404, "Not found"))).toBeUndefined();
    expect(
      errorCode(new ApiError(400, "Bad", undefined, [{ message: "Bad", context: { code: 7 } }]))
    ).toBeUndefined();
  });

  it("returns undefined for an error that is not from the API", () => {
    expect(errorCode(new TypeError("Failed to fetch"))).toBeUndefined();
  });
});
