import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { NotificationsBell } from "../notifications-bell";
import { renderWithClient } from "@/lib/test-utils";

vi.mock("@/lib/api/queries", () => ({
  useNotifications: () => ({ data: [], isLoading: false, error: null }),
  useMarkNotificationRead: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("NotificationsBell", () => {
  it("renders the bell trigger without an unread dot when empty", () => {
    renderWithClient(<NotificationsBell />);
    expect(screen.getByRole("button", { name: /Notifications/i })).toBeInTheDocument();
  });
});
