import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const sessionState = { data: null as unknown, isPending: false };

vi.mock("@/lib/auth-client", () => ({
  useSession: () => sessionState,
}));

import { useSupportAdmin } from "../use-support-admin";

describe("useSupportAdmin", () => {
  it("is false while the session is loading", () => {
    sessionState.data = null;
    sessionState.isPending = true;
    const { result } = renderHook(() => useSupportAdmin());
    expect(result.current).toEqual({ supportAdmin: false, isPending: true });
  });

  it("is false for a session without the flag", () => {
    sessionState.data = { user: { id: "u-1" } };
    sessionState.isPending = false;
    const { result } = renderHook(() => useSupportAdmin());
    expect(result.current.supportAdmin).toBe(false);
  });

  it("is true only for the literal true flag", () => {
    sessionState.data = { user: { id: "u-1" }, supportAdmin: true };
    sessionState.isPending = false;
    expect(renderHook(() => useSupportAdmin()).result.current.supportAdmin).toBe(true);

    sessionState.data = { user: { id: "u-1" }, supportAdmin: "yes" };
    expect(renderHook(() => useSupportAdmin()).result.current.supportAdmin).toBe(false);
  });
});
