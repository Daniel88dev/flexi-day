import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "../page";
import { renderWithClient } from "@/lib/test-utils";

const updateMutate = vi.fn().mockResolvedValue({ emailNotifications: false });
let settings: { emailNotifications: boolean } | undefined = { emailNotifications: true };

vi.mock("@/lib/api/queries", () => ({
  useMySettings: () => ({ data: settings, isLoading: false, error: null }),
  useUpdateMySettings: () => ({ mutateAsync: updateMutate, isPending: false }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { email: "dana@example.com" } } }),
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    settings = { emailNotifications: true };
    updateMutate.mockClear();
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
});
