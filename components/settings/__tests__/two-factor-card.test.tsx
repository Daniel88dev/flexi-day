import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TwoFactorCard } from "../two-factor-card";

const enableMock = vi.fn();
const disableMock = vi.fn();
const verifyTotpMock = vi.fn();
const verifyOtpMock = vi.fn();
const sendOtpMock = vi.fn();
const getTotpUriMock = vi.fn();
const generateBackupCodesMock = vi.fn();
const pushToastMock = vi.fn();

let twoFactorEnabled = false;

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { email: "dana@example.com", twoFactorEnabled } } }),
  authClient: {
    twoFactor: {
      enable: (...args: unknown[]) => enableMock(...args),
      disable: (...args: unknown[]) => disableMock(...args),
      verifyTotp: (...args: unknown[]) => verifyTotpMock(...args),
      verifyOtp: (...args: unknown[]) => verifyOtpMock(...args),
      sendOtp: (...args: unknown[]) => sendOtpMock(...args),
      getTotpUri: (...args: unknown[]) => getTotpUriMock(...args),
      generateBackupCodes: (...args: unknown[]) => generateBackupCodesMock(...args),
    },
  },
}));

vi.mock("@/components/toast", () => ({
  pushToast: (...args: unknown[]) => pushToastMock(...args),
}));

const TOTP_URI = "otpauth://totp/Flexi%20Day:dana%40example.com?secret=ABC234&issuer=Flexi+Day";
const CODES = ["aaaaa-aaaaa", "bbbbb-bbbbb"];

beforeEach(() => {
  vi.clearAllMocks();
  twoFactorEnabled = false;
  enableMock.mockResolvedValue({
    data: { method: "totp", totpURI: TOTP_URI, backupCodes: CODES },
    error: null,
  });
  verifyTotpMock.mockResolvedValue({ data: {}, error: null });
  verifyOtpMock.mockResolvedValue({ data: {}, error: null });
  sendOtpMock.mockResolvedValue({ data: { status: true }, error: null });
  disableMock.mockResolvedValue({ data: {}, error: null });
  getTotpUriMock.mockResolvedValue({ data: { totpURI: TOTP_URI }, error: null });
  generateBackupCodesMock.mockResolvedValue({
    data: { status: true, backupCodes: CODES },
    error: null,
  });
});

async function startEnableFlow() {
  const user = userEvent.setup();
  render(<TwoFactorCard />);
  await user.click(screen.getByRole("button", { name: "Enable two-factor" }));
  await user.type(screen.getByLabelText("Password"), "hunter2hunter2");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  // Backup codes come first — both methods need them saved.
  expect(await screen.findByText("aaaaa-aaaaa")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "I saved my backup codes" }));
  return user;
}

describe("TwoFactorCard", () => {
  it("shows the disabled state with an enable action", () => {
    render(<TwoFactorCard />);
    expect(screen.getByText("Not enabled")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enable two-factor" })).toBeInTheDocument();
  });

  it("enrolls through the authenticator path: password → codes → QR → verify", async () => {
    const user = await startEnableFlow();
    // Asking for "totp" is what makes the response carry a secret at all —
    // the "otp" branch turns 2FA on and answers with neither URI nor codes.
    expect(enableMock).toHaveBeenCalledWith({ password: "hunter2hunter2", method: "totp" });

    await user.click(screen.getByRole("button", { name: /Authenticator app/ }));
    // QR + manual secret from the enable response's URI.
    expect(screen.getByText("ABC234")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Code"), "123456");
    await user.click(screen.getByRole("button", { name: "Verify" }));
    expect(verifyTotpMock).toHaveBeenCalledWith({ code: "123456" });
    expect(pushToastMock).toHaveBeenCalledWith("Two-factor authentication is on.");
  });

  it("enrolls through the email path: sends a code, verifies with verifyOtp", async () => {
    const user = await startEnableFlow();

    await user.click(screen.getByRole("button", { name: /Email code/ }));
    expect(sendOtpMock).toHaveBeenCalledTimes(1);

    await user.type(await screen.findByLabelText("Code"), "654321");
    await user.click(screen.getByRole("button", { name: "Verify" }));
    expect(verifyOtpMock).toHaveBeenCalledWith({ code: "654321" });
    expect(verifyTotpMock).not.toHaveBeenCalled();
    expect(pushToastMock).toHaveBeenCalledWith("Two-factor authentication is on.");
  });

  it("surfaces a wrong password without leaving the password step", async () => {
    enableMock.mockResolvedValue({
      data: null,
      error: { status: 400, code: "INVALID_PASSWORD", message: "Invalid password" },
    });
    const user = userEvent.setup();
    render(<TwoFactorCard />);
    await user.click(screen.getByRole("button", { name: "Enable two-factor" }));
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("Invalid password")).toBeInTheDocument();
    expect(screen.queryByText("aaaaa-aaaaa")).not.toBeInTheDocument();
  });

  it("shows a friendly message for a wrong verification code", async () => {
    verifyTotpMock.mockResolvedValue({
      data: null,
      error: { status: 401, code: "INVALID_CODE", message: "Invalid code" },
    });
    const user = await startEnableFlow();
    await user.click(screen.getByRole("button", { name: /Authenticator app/ }));
    await user.type(screen.getByLabelText("Code"), "000000");
    await user.click(screen.getByRole("button", { name: "Verify" }));

    expect(await screen.findByText("That code isn't valid. Try again.")).toBeInTheDocument();
    expect(pushToastMock).not.toHaveBeenCalled();
  });

  it("gives in-session advice when the code budget is spent, not 'sign in again'", async () => {
    verifyOtpMock.mockResolvedValue({
      data: null,
      error: { status: 400, code: "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE", message: "Too many" },
    });
    const user = await startEnableFlow();
    await user.click(screen.getByRole("button", { name: /Email code/ }));
    await user.type(await screen.findByLabelText("Code"), "000000");
    await user.click(screen.getByRole("button", { name: "Verify" }));

    expect(
      await screen.findByText("Too many attempts — request a new code and try again.")
    ).toBeInTheDocument();
    expect(screen.queryByText(/Sign in again/)).not.toBeInTheDocument();
  });

  it("never offers enable() once 2FA is on — only manage actions", () => {
    twoFactorEnabled = true;
    render(<TwoFactorCard />);
    expect(screen.getByText("Enabled")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enable two-factor" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Set up authenticator app" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New backup codes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Disable" })).toBeInTheDocument();
  });

  it("adds an authenticator later via getTotpUri, never enable()", async () => {
    twoFactorEnabled = true;
    const user = userEvent.setup();
    render(<TwoFactorCard />);
    await user.click(screen.getByRole("button", { name: "Set up authenticator app" }));
    await user.type(screen.getByLabelText("Password"), "hunter2hunter2");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(getTotpUriMock).toHaveBeenCalledWith({ password: "hunter2hunter2" });
    expect(enableMock).not.toHaveBeenCalled();
    expect(await screen.findByText("ABC234")).toBeInTheDocument();
  });

  it("regenerates backup codes behind the password and shows them once", async () => {
    twoFactorEnabled = true;
    const user = userEvent.setup();
    render(<TwoFactorCard />);
    await user.click(screen.getByRole("button", { name: "New backup codes" }));
    await user.type(screen.getByLabelText("Password"), "hunter2hunter2");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(generateBackupCodesMock).toHaveBeenCalledWith({ password: "hunter2hunter2" });
    expect(await screen.findByText("aaaaa-aaaaa")).toBeInTheDocument();
  });

  it("disables 2FA with the password", async () => {
    twoFactorEnabled = true;
    const user = userEvent.setup();
    render(<TwoFactorCard />);
    await user.click(screen.getByRole("button", { name: "Disable" }));
    await user.type(screen.getByLabelText("Password"), "hunter2hunter2");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(disableMock).toHaveBeenCalledWith({ password: "hunter2hunter2" });
    expect(pushToastMock).toHaveBeenCalledWith("Two-factor authentication is off.");
  });
});
