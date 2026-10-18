import { describe, expect, it, vi, beforeEach } from "vitest";
import { useSyncExternalStore } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignUpPage from "../page";

type SessionState = { data: { user: { id: string } } | null; isPending: boolean };

// A stand-in for better-auth's session atom, so the test can replay what it does after a
// successful POST /sign-up/email: flip the session signal, mark a signed-out session pending
// while GET /get-session runs, then settle on no session (e-mail verification is required).
const session = (() => {
  let state: SessionState = { data: null, isPending: false };
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(next: SessionState) {
      state = next;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
})();

const signUpEmail = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signUp: { email: (...args: unknown[]) => signUpEmail(...args) },
    signIn: { social: vi.fn() },
  },
  useSession: () => useSyncExternalStore(session.subscribe, session.get),
}));

const CHECK_INBOX =
  "Check your inbox for a verification email. You'll be signed in automatically once you verify.";

async function fillAndSubmit() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Your name"), "Dana Holt");
  await user.type(screen.getByLabelText("Work email"), "dana@northwind.co");
  await user.type(screen.getByLabelText("Password"), "supersecret");
  await user.type(screen.getByLabelText("Confirm password"), "supersecret");
  await user.click(screen.getByRole("button", { name: /Create account/i }));
}

describe("SignUpPage", () => {
  beforeEach(() => {
    session.set({ data: null, isPending: false });
    signUpEmail.mockReset();
    signUpEmail.mockResolvedValue({ data: { user: { id: "u-1" } }, error: null });
  });

  it("keeps the check-your-inbox message through the session refetch that follows sign-up", async () => {
    render(<SignUpPage />);

    await fillAndSubmit();
    expect(screen.getByText(CHECK_INBOX)).toBeInTheDocument();

    act(() => session.set({ data: null, isPending: true }));
    act(() => session.set({ data: null, isPending: false }));

    expect(screen.getByText(CHECK_INBOX)).toBeInTheDocument();
  });
});
