import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadAccountExport } from "../account-export";
import { API_BASE_URL, ApiError } from "../client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("downloadAccountExport", () => {
  it("GETs the export with the session cookie and returns the file with its filename", async () => {
    const blob = new Blob(["{}"], { type: "application/json" });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(blob),
      headers: new Headers({
        "Content-Disposition": 'attachment; filename="flexi-day-account-2026-10-25.json"',
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await downloadAccountExport();

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/users/me/export`,
      expect.objectContaining({ method: "GET", credentials: "include" })
    );
    expect(result).toEqual({ blob, filename: "flexi-day-account-2026-10-25.json" });
  });

  it("falls back to a fixed filename when the server sends no disposition", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(["{}"])),
        headers: new Headers(),
      })
    );

    await expect(downloadAccountExport()).resolves.toMatchObject({
      filename: "flexi-day-account.json",
    });
  });

  it("throws an ApiError with the server's message when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: () => Promise.resolve(JSON.stringify({ errors: [{ message: "Not signed in" }] })),
        headers: new Headers(),
      })
    );

    const failure = downloadAccountExport();
    await expect(failure).rejects.toBeInstanceOf(ApiError);
    await expect(failure).rejects.toMatchObject({ status: 401, message: "Not signed in" });
  });
});
