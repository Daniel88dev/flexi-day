import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignUpPage from "../page";

const signUpEmail = vi.fn().mockResolvedValue({ error: null });
const signUpWithTeam = vi.fn().mockResolvedValue({ token: null });

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: { signUp: { email: (...args: unknown[]) => signUpEmail(...args) } },
  useSession: () => ({ data: null, isPending: false }),
}));

vi.mock("@/lib/api/auth-signup", () => ({
  signUpWithTeam: (...args: unknown[]) => signUpWithTeam(...args),
}));

describe("SignUpPage", () => {
  beforeEach(() => {
    signUpEmail.mockClear();
    signUpWithTeam.mockClear();
  });

  it("shows a confirm-password field", () => {
    render(<SignUpPage />);
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
  });

  it("blocks submit when the two passwords differ", async () => {
    const user = userEvent.setup();
    render(<SignUpPage />);

    await user.type(screen.getByLabelText("Your name"), "Dana Holt");
    await user.type(screen.getByLabelText("Work email"), "dana@northwind.co");
    await user.type(screen.getByLabelText("Password"), "supersecret");
    await user.type(screen.getByLabelText("Confirm password"), "different123");
    await user.click(screen.getByRole("button", { name: /Create team/i }));

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(signUpEmail).not.toHaveBeenCalled();
    expect(signUpWithTeam).not.toHaveBeenCalled();
  });

  it("submits when the passwords match", async () => {
    const user = userEvent.setup();
    render(<SignUpPage />);

    await user.type(screen.getByLabelText("Your name"), "Dana Holt");
    await user.type(screen.getByLabelText("Work email"), "dana@northwind.co");
    await user.type(screen.getByLabelText("Password"), "supersecret");
    await user.type(screen.getByLabelText("Confirm password"), "supersecret");
    await user.click(screen.getByRole("button", { name: /Create team/i }));

    expect(signUpEmail).toHaveBeenCalledWith({
      name: "Dana Holt",
      email: "dana@northwind.co",
      password: "supersecret",
    });
  });
});
