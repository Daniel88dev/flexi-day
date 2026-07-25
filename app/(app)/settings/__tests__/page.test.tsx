import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "../page";
import { renderWithClient } from "@/lib/test-utils";

const updateMutate = vi.fn().mockResolvedValue({ emailNotifications: false });
const changePasswordMock = vi.fn().mockResolvedValue({ error: null });
let settings: { emailNotifications: boolean } | undefined = { emailNotifications: true };

vi.mock("@/lib/api/queries", () => ({
  useMySettings: () => ({ data: settings, isLoading: false, error: null }),
  useUpdateMySettings: () => ({ mutateAsync: updateMutate, isPending: false }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { email: "dana@example.com" } } }),
  changePassword: (...args: unknown[]) => changePasswordMock(...args),
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    settings = { emailNotifications: true };
    updateMutate.mockClear();
    changePasswordMock.mockClear();
  });

  it("renders the account email and the notification toggle", () => {
    renderWithClient(<SettingsPage />);

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText(/dana@example.com/)).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /Email notifications/i })).toBeChecked();
  });

  it("saves the new value when toggled off", async () => {
    const user = userEvent.setup();
    renderWithClient(<SettingsPage />);

    await user.click(screen.getByRole("switch", { name: /Email notifications/i }));

    expect(updateMutate).toHaveBeenCalledWith({ emailNotifications: false });
  });

  it("treats a user with no stored settings as opted in", () => {
    settings = undefined;
    renderWithClient(<SettingsPage />);

    expect(screen.getByRole("switch", { name: /Email notifications/i })).toBeChecked();
  });

  it("renders the change-password fields", () => {
    renderWithClient(<SettingsPage />);

    expect(screen.getByLabelText("Current password")).toBeInTheDocument();
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm new password")).toBeInTheDocument();
  });

  it("blocks the change when the two new passwords differ", async () => {
    const user = userEvent.setup();
    renderWithClient(<SettingsPage />);

    await user.type(screen.getByLabelText("Current password"), "oldpassword");
    await user.type(screen.getByLabelText("New password"), "newpassword1");
    await user.type(screen.getByLabelText("Confirm new password"), "newpassword2");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it("changes the password when the fields are valid and matching", async () => {
    const user = userEvent.setup();
    renderWithClient(<SettingsPage />);

    await user.type(screen.getByLabelText("Current password"), "oldpassword");
    await user.type(screen.getByLabelText("New password"), "newpassword1");
    await user.type(screen.getByLabelText("Confirm new password"), "newpassword1");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(changePasswordMock).toHaveBeenCalledWith({
      currentPassword: "oldpassword",
      newPassword: "newpassword1",
      revokeOtherSessions: true,
    });
  });
});
