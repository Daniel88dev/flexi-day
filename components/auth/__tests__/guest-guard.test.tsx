import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { GuestGuard, GuestRedirect } from "../guest-guard";

const replace = vi.fn();
let sessionState: { data: unknown; isPending: boolean } = { data: null, isPending: false };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => sessionState,
}));

describe("GuestGuard", () => {
  beforeEach(() => {
    replace.mockClear();
    sessionState = { data: null, isPending: false };
  });

  it("renders the page for a signed-out visitor", () => {
    render(
      <GuestGuard>
        <p>Sign in form</p>
      </GuestGuard>
    );

    expect(screen.getByText("Sign in form")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects a signed-in user to the dashboard without showing the page", async () => {
    sessionState = { data: { user: { id: "u-1" } }, isPending: false };

    render(
      <GuestGuard>
        <p>Sign in form</p>
      </GuestGuard>
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    expect(screen.queryByText("Sign in form")).not.toBeInTheDocument();
  });

  it("waits for a pending session rather than flashing the page", () => {
    sessionState = { data: null, isPending: true };

    render(
      <GuestGuard>
        <p>Sign in form</p>
      </GuestGuard>
    );

    expect(screen.queryByText("Sign in form")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("GuestRedirect", () => {
  beforeEach(() => {
    replace.mockClear();
    sessionState = { data: null, isPending: false };
  });

  it("renders nothing and leaves signed-out visitors alone", () => {
    const { container } = render(<GuestRedirect />);

    expect(container).toBeEmptyDOMElement();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects a signed-in visitor to the dashboard", async () => {
    sessionState = { data: { user: { id: "u-1" } }, isPending: false };

    render(<GuestRedirect />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });
});
