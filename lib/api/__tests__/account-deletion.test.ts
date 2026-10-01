import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../client";

const apiMock = vi.fn();
vi.mock("../client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../client")>()),
  api: (...args: unknown[]) => apiMock(...args),
}));

import { deleteMyAccount, deletionRefusal, getAccountDeletionStatus } from "../account-deletion";

function refusal(status: number, reason: string) {
  return new ApiError(status, "refused", undefined, [{ message: "refused", context: { reason } }]);
}

describe("account deletion api", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue(undefined);
  });

  it("getAccountDeletionStatus GETs the caller's deletion status", async () => {
    await getAccountDeletionStatus();
    expect(apiMock).toHaveBeenCalledWith("/api/users/me/deletion");
  });

  it("deleteMyAccount POSTs the password", async () => {
    await deleteMyAccount("hunter22");
    expect(apiMock).toHaveBeenCalledWith("/api/users/me/delete", {
      method: "POST",
      body: { password: "hunter22" },
    });
  });

  it("deleteMyAccount sends an empty body for a social-only user", async () => {
    await deleteMyAccount();
    expect(apiMock).toHaveBeenCalledWith("/api/users/me/delete", { method: "POST", body: {} });
  });
});

describe("deletionRefusal", () => {
  it("returns PASSWORD_INVALID for a 403 with that reason", () => {
    expect(deletionRefusal(refusal(403, "PASSWORD_INVALID"))).toBe("PASSWORD_INVALID");
  });

  it("returns REAUTH_REQUIRED for a 403 with that reason", () => {
    expect(deletionRefusal(refusal(403, "REAUTH_REQUIRED"))).toBe("REAUTH_REQUIRED");
  });

  it("returns DELETION_BLOCKED for a 409 with that reason", () => {
    expect(deletionRefusal(refusal(409, "DELETION_BLOCKED"))).toBe("DELETION_BLOCKED");
  });

  it("returns null for a 403 without a known reason", () => {
    expect(deletionRefusal(new ApiError(403, "Forbidden"))).toBeNull();
  });

  it("returns null when the reason arrives with the wrong status", () => {
    expect(deletionRefusal(refusal(500, "PASSWORD_INVALID"))).toBeNull();
  });

  it("returns null for anything that is not an API error", () => {
    expect(deletionRefusal(new Error("offline"))).toBeNull();
  });
});
