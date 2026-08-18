import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignInPage from "../page";

const replaceMock = vi.fn();
const refreshMock = vi.fn();
const signInEmailMock = vi.fn();

let search = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => search,
  useRouter: () => ({ replace: replaceMock, refresh: refreshMock }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: null, isPending: false }),
  authClient: {
    signIn: {
      email: (...args: unknown[]) => signInEmailMock(...args),
      social: vi.fn(),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  search = new URLSearchParams();
  signInEmailMock.mockResolvedValue({ data: { token: "t", user: {} }, error: null });
});

async function submit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Work email"), "dana@example.com");
  await user.type(screen.getByPlaceholderText("••••••••"), "hunter2hunter2");
  await user.click(screen.getByRole("button", { name: /Sign in/ }));
}

describe("SignInPage", () => {
  it("lands on the dashboard after a plain sign-in", async () => {
    const user = userEvent.setup();
    render(<SignInPage />);
    await submit(user);

    expect(signInEmailMock).toHaveBeenCalledWith({
      email: "dana@example.com",
      password: "hunter2hunter2",
    });
    expect(replaceMock).toHaveBeenCalledWith("/dashboard");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("routes a 2FA account to the challenge page instead of the dashboard", async () => {
    // The server deleted the session it just made and set a challenge cookie —
    // treating this response as success would strand the user.
    signInEmailMock.mockResolvedValue({
      data: { twoFactorRedirect: true, twoFactorMethods: ["totp", "otp"] },
      error: null,
    });
    search = new URLSearchParams("redirect=%2Fsettings%2F");
    const user = userEvent.setup();
    render(<SignInPage />);
    await submit(user);

    expect(replaceMock).toHaveBeenCalledWith("/two-factor/?redirect=%2Fsettings%2F&methods=totp%2Cotp");
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("keeps the challenge redirect same-origin", async () => {
    signInEmailMock.mockResolvedValue({
      data: { twoFactorRedirect: true, twoFactorMethods: ["otp"] },
      error: null,
    });
    search = new URLSearchParams("redirect=https%3A%2F%2Fevil.example%2F");
    const user = userEvent.setup();
    render(<SignInPage />);
    await submit(user);

    expect(replaceMock).toHaveBeenCalledWith("/two-factor/?redirect=%2Fdashboard&methods=otp");
  });

  it("shows the server's message on a failed sign-in", async () => {
    signInEmailMock.mockResolvedValue({
      data: null,
      error: { status: 401, message: "Invalid email or password" },
    });
    const user = userEvent.setup();
    render(<SignInPage />);
    await submit(user);

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
