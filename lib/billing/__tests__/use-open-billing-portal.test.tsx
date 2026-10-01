import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useOpenBillingPortal } from "../use-open-billing-portal";

const portalMutate = vi.fn();
vi.mock("@/lib/api/queries", () => ({
  useCreatePortalSession: () => ({ mutateAsync: portalMutate, isPending: false }),
}));

const pushToastMock = vi.fn();
vi.mock("@/components/toast", () => ({
  pushToast: (...args: unknown[]) => pushToastMock(...args),
}));

const PORTAL_URL = "https://customer-portal.paddle.com/cpl_abc123";

describe("useOpenBillingPortal", () => {
  let tab: { location: { href: string }; close: ReturnType<typeof vi.fn>; opener: unknown };

  beforeEach(() => {
    tab = { location: { href: "" }, close: vi.fn(), opener: window };
    vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
    portalMutate.mockReset();
    pushToastMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends the portal URL to a new tab cut off from this one", async () => {
    portalMutate.mockResolvedValue({ url: PORTAL_URL });
    const { result } = renderHook(() => useOpenBillingPortal());

    await act(() => result.current.open());

    expect(window.open).toHaveBeenCalledWith("", "_blank");
    expect(tab.opener).toBeNull();
    expect(tab.location.href).toBe(PORTAL_URL);
  });

  it("closes the tab and warns when the portal request fails", async () => {
    portalMutate.mockRejectedValue(new Error("No billing account yet"));
    const { result } = renderHook(() => useOpenBillingPortal());

    await act(() => result.current.open());

    expect(tab.close).toHaveBeenCalled();
    expect(pushToastMock).toHaveBeenCalledWith("No billing account yet", "danger");
  });
});
