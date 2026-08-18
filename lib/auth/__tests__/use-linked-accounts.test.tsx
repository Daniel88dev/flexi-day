import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  hasPasswordAccount,
  shouldOfferPasswordChange,
  useLinkedAccounts,
} from "../use-linked-accounts";

const listAccounts = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  authClient: { listAccounts: () => listAccounts() },
}));

/** One client per test: the hook's key is shared, so a reused cache leaks. */
function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

describe("hasPasswordAccount", () => {
  it("returns undefined while the accounts are unknown", () => {
    // Distinguishing "no password" from "not loaded yet" is what stops the
    // change-password card flashing in and out on every settings visit.
    expect(hasPasswordAccount(undefined)).toBeUndefined();
  });

  it("returns false for a user who only signed in with a provider", () => {
    expect(hasPasswordAccount([{ providerId: "google" }])).toBe(false);
  });

  it("returns true once a credential account is present", () => {
    expect(hasPasswordAccount([{ providerId: "google" }, { providerId: "credential" }])).toBe(true);
  });

  it("returns false for an account list that is empty", () => {
    expect(hasPasswordAccount([])).toBe(false);
  });
});

describe("shouldOfferPasswordChange", () => {
  it("offers the form to an account that has a password", () => {
    expect(
      shouldOfferPasswordChange({ data: [{ providerId: "credential" }], isError: false })
    ).toBe(true);
  });

  it("withholds it from an account that only has a provider", () => {
    expect(shouldOfferPasswordChange({ data: [{ providerId: "google" }], isError: false })).toBe(
      false
    );
  });

  it("withholds it while the answer is still unknown", () => {
    expect(shouldOfferPasswordChange({ data: undefined, isError: false })).toBe(false);
  });

  it("offers it when the lookup failed, rather than stranding a password user", () => {
    // Guessing wrong here costs one rejected request. Guessing the other way
    // removes the only control they came for, with no explanation.
    expect(shouldOfferPasswordChange({ data: undefined, isError: true })).toBe(true);
  });
});

describe("useLinkedAccounts", () => {
  it("returns the accounts better-auth reports", async () => {
    listAccounts.mockResolvedValue({
      data: [{ providerId: "credential" }, { providerId: "microsoft" }],
      error: null,
    });
    const { result } = renderHook(() => useLinkedAccounts(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.data).toHaveLength(2));
    expect(hasPasswordAccount(result.current.data)).toBe(true);
  });

  it("surfaces a failure instead of reporting an empty list", async () => {
    listAccounts.mockResolvedValue({ data: null, error: { message: "boom" } });
    const { result } = renderHook(() => useLinkedAccounts(), { wrapper: wrapper() });

    // An empty list would read as "no password", silently hiding the
    // change-password card from someone who has one.
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
