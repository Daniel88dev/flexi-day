import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "../page";
import { ToastHost } from "@/components/toast";
import { renderWithClient } from "@/lib/test-utils";

import type { UserSettings } from "@/lib/api/types";

const updateMutate = vi.fn().mockResolvedValue({ emailNotifications: false });
const changePasswordMock = vi.fn().mockResolvedValue({ error: null });

const DEFAULT_SETTINGS: UserSettings = {
  emailNotifications: true,
  dashboardScope: "MINE",
  dashboardGroupId: null,
};

let settings: UserSettings | undefined = DEFAULT_SETTINGS;
let scopeGroups = [
  { groupId: "g1", groupName: "Team A", access: "all" as const, canEditQuotas: false },
  { groupId: "g2", groupName: "Team B", access: "all" as const, canEditQuotas: false },
];

vi.mock("@/lib/api/queries", () => ({
  useMySettings: () => ({ data: settings, isLoading: false, error: null }),
  useUpdateMySettings: () => ({ mutateAsync: updateMutate, isPending: false }),
  useReportScope: () => ({
    data: { groups: scopeGroups, members: [], years: [] },
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { email: "dana@example.com" } } }),
  changePassword: (...args: unknown[]) => changePasswordMock(...args),
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    settings = DEFAULT_SETTINGS;
    scopeGroups = [
      { groupId: "g1", groupName: "Team A", access: "all" as const, canEditQuotas: false },
      { groupId: "g2", groupName: "Team B", access: "all" as const, canEditQuotas: false },
    ];
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

  it("holds dashboard edits until Save is pressed", async () => {
    const user = userEvent.setup();
    renderWithClient(<SettingsPage />);

    await user.click(screen.getByRole("button", { name: "My group", pressed: false }));

    // Picking a scope is an edit, not a write.
    expect(updateMutate).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updateMutate).toHaveBeenCalledWith({
      dashboardScope: "GROUP",
      dashboardGroupId: "g1",
    });
  });

  it("keeps the stored group when switching back to group scope", async () => {
    settings = { ...DEFAULT_SETTINGS, dashboardGroupId: "g2" };
    const user = userEvent.setup();
    renderWithClient(<SettingsPage />);

    await user.click(screen.getByRole("button", { name: "My group", pressed: false }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updateMutate).toHaveBeenCalledWith({
      dashboardScope: "GROUP",
      dashboardGroupId: "g2",
    });
  });

  it("keeps Save disabled until something actually changes", async () => {
    const user = userEvent.setup();
    renderWithClient(<SettingsPage />);

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "My group", pressed: false }));

    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("discards the draft on Cancel", async () => {
    const user = userEvent.setup();
    renderWithClient(<SettingsPage />);

    await user.click(screen.getByRole("button", { name: "My group", pressed: false }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("button", { name: "Only me" })).toHaveAttribute("aria-pressed", "true");
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it("confirms the write with a toast", async () => {
    const user = userEvent.setup();
    render(<ToastHost />);
    renderWithClient(<SettingsPage />);

    await user.click(screen.getByRole("button", { name: "My group", pressed: false }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Saved")).toBeInTheDocument();
  });

  it("surfaces a failed write as a toast instead of a silent no-op", async () => {
    updateMutate.mockRejectedValueOnce(new Error("Nope"));
    const user = userEvent.setup();
    const { container: toastContainer } = render(<ToastHost />);
    renderWithClient(<SettingsPage />);

    await user.click(screen.getByRole("button", { name: "My group", pressed: false }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    // Also rendered inline on the card, so scope the assertion to the toast.
    expect(await within(toastContainer).findByText("Nope")).toBeInTheDocument();
  });

  it("offers no group scope when the user may not view any group", () => {
    scopeGroups = [];
    renderWithClient(<SettingsPage />);

    expect(screen.getByRole("button", { name: "My group" })).toBeDisabled();
    expect(screen.getByText(/cannot view any group/i)).toBeInTheDocument();
  });

  it("disables the group picker while the calendar is personal", () => {
    renderWithClient(<SettingsPage />);

    expect(screen.getByRole("combobox", { name: "Group" })).toBeDisabled();
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
