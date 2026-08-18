import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TwoFactorPage from "../page";

const replaceMock = vi.fn();
const refreshMock = vi.fn();
const verifyTotpMock = vi.fn();
const verifyOtpMock = vi.fn();
const verifyBackupCodeMock = vi.fn();
const sendOtpMock = vi.fn();

let search = new URLSearchParams("methods=totp,otp");

vi.mock("next/navigation", () => ({
  useSearchParams: () => search,
  useRouter: () => ({ replace: replaceMock, refresh: refreshMock }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    twoFactor: {
      verifyTotp: (...args: unknown[]) => verifyTotpMock(...args),
      verifyOtp: (...args: unknown[]) => verifyOtpMock(...args),
      verifyBackupCode: (...args: unknown[]) => verifyBackupCodeMock(...args),
      sendOtp: (...args: unknown[]) => sendOtpMock(...args),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  search = new URLSearchParams("methods=totp,otp");
  verifyTotpMock.mockResolvedValue({ data: {}, error: null });
  verifyOtpMock.mockResolvedValue({ data: {}, error: null });
  verifyBackupCodeMock.mockResolvedValue({ data: {}, error: null });
  sendOtpMock.mockResolvedValue({ data: { status: true }, error: null });
});

describe("TwoFactorPage", () => {
  it("defaults to the authenticator when the account has one linked", () => {
    render(<TwoFactorPage />);
    expect(screen.getByText("Enter the code from your authenticator app.")).toBeInTheDocument();
    // No automatic email until the user asks for one.
    expect(sendOtpMock).not.toHaveBeenCalled();
  });

  it("defaults to email and auto-sends a code for an email-only enrollee", async () => {
    search = new URLSearchParams("methods=otp");
    render(<TwoFactorPage />);
    expect(screen.getByText("We emailed you a sign-in code.")).toBeInTheDocument();
    await waitFor(() => expect(sendOtpMock).toHaveBeenCalledTimes(1));
    // TOTP is not offered — the server would reject it for an unverified row.
    expect(screen.queryByText("Use your authenticator app")).not.toBeInTheDocument();
  });

  it("verifies a TOTP code and lands on the requested page", async () => {
    search = new URLSearchParams("methods=totp,otp&redirect=%2Fsettings%2F");
    const user = userEvent.setup();
    render(<TwoFactorPage />);
    await user.type(screen.getByLabelText("Code"), "123456");
    await user.click(screen.getByRole("button", { name: "Verify" }));

    expect(verifyTotpMock).toHaveBeenCalledWith({ code: "123456", trustDevice: false });
    expect(replaceMock).toHaveBeenCalledWith("/settings/");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("never follows an off-site redirect", async () => {
    search = new URLSearchParams("methods=totp&redirect=https%3A%2F%2Fevil.example%2F");
    const user = userEvent.setup();
    render(<TwoFactorPage />);
    await user.type(screen.getByLabelText("Code"), "123456");
    await user.click(screen.getByRole("button", { name: "Verify" }));

    expect(replaceMock).toHaveBeenCalledWith("/dashboard");
  });

  it("passes trustDevice through when the box is ticked", async () => {
    const user = userEvent.setup();
    render(<TwoFactorPage />);
    await user.click(screen.getByRole("checkbox"));
    await user.type(screen.getByLabelText("Code"), "123456");
    await user.click(screen.getByRole("button", { name: "Verify" }));

    expect(verifyTotpMock).toHaveBeenCalledWith({ code: "123456", trustDevice: true });
  });

  it("switches to a backup code and calls the matching endpoint", async () => {
    const user = userEvent.setup();
    render(<TwoFactorPage />);
    await user.click(screen.getByRole("button", { name: "Use a backup code" }));
    await user.type(screen.getByLabelText("Backup code"), "aaaaa-bbbbb");
    await user.click(screen.getByRole("button", { name: "Verify" }));

    expect(verifyBackupCodeMock).toHaveBeenCalledWith({
      code: "aaaaa-bbbbb",
      trustDevice: false,
    });
    expect(verifyTotpMock).not.toHaveBeenCalled();
  });

  it("shows the mapped message for a wrong code and stays usable", async () => {
    verifyTotpMock.mockResolvedValue({
      data: null,
      error: { status: 401, code: "INVALID_CODE", message: "Invalid code" },
    });
    const user = userEvent.setup();
    render(<TwoFactorPage />);
    await user.type(screen.getByLabelText("Code"), "000000");
    await user.click(screen.getByRole("button", { name: "Verify" }));

    expect(await screen.findByText("That code isn't valid. Try again.")).toBeInTheDocument();
    expect(screen.getByLabelText("Code")).toBeEnabled();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("keeps resend alive when the emailed code's attempts are spent", async () => {
    search = new URLSearchParams("methods=otp");
    verifyOtpMock.mockResolvedValue({
      data: null,
      error: { status: 400, code: "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE", message: "Too many" },
    });
    const user = userEvent.setup();
    render(<TwoFactorPage />);
    await waitFor(() => expect(sendOtpMock).toHaveBeenCalledTimes(1));
    await user.type(screen.getByLabelText("Code"), "000000");
    await user.click(screen.getByRole("button", { name: "Verify" }));

    expect(
      await screen.findByText("Too many attempts — request a new code and try again.")
    ).toBeInTheDocument();
    // The challenge cookie survives — a fresh code restarts the budget.
    expect(screen.getByLabelText("Code")).toBeEnabled();
    expect(screen.getByRole("button", { name: /Resend code/ })).toBeInTheDocument();
  });

  it("locks the form when the challenge is dead — only a fresh sign-in helps", async () => {
    verifyTotpMock.mockResolvedValue({
      data: null,
      error: { status: 401, code: "INVALID_TWO_FACTOR_COOKIE", message: "Invalid cookie" },
    });
    const user = userEvent.setup();
    render(<TwoFactorPage />);
    await user.type(screen.getByLabelText("Code"), "123456");
    await user.click(screen.getByRole("button", { name: "Verify" }));

    expect(
      await screen.findByText("This sign-in challenge has expired. Please sign in again.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Code")).toBeDisabled();
    // No method switch can revive a consumed challenge cookie.
    expect(screen.queryByRole("button", { name: "Use a backup code" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to sign in" })).toBeInTheDocument();
  });
});
