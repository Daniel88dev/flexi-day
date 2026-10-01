import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthGuard } from "../auth-guard";

const replaceMock = vi.fn();
let session: { user: { email: string } } | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => "/settings/",
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: session, isPending: false }),
}));

describe("AuthGuard", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    session = null;
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("sends a signed-out visitor to sign-in with the page as the redirect", async () => {
    window.history.replaceState(null, "", "/settings/");
    render(<AuthGuard>secret</AuthGuard>);

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith(
        `/sign-in?redirect=${encodeURIComponent("/settings/")}`
      )
    );
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("keeps the query string, so a direct link survives the sign-in", async () => {
    window.history.replaceState(null, "", "/settings/?delete-account");
    render(<AuthGuard>secret</AuthGuard>);

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith(
        `/sign-in?redirect=${encodeURIComponent("/settings/?delete-account")}`
      )
    );
  });

  it("renders the page for a signed-in user", () => {
    session = { user: { email: "dana@example.com" } };
    render(<AuthGuard>secret</AuthGuard>);

    expect(screen.getByText("secret")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
