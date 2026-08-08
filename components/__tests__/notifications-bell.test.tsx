import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationsBell } from "../notifications-bell";
import { renderWithClient } from "@/lib/test-utils";
import type { AppNotification } from "@/lib/api/types";

const replaceSpy = vi.fn();
const markReadSpy = vi.fn();
const markAllReadSpy = vi.fn();
const removeSpy = vi.fn();
const removeAllSpy = vi.fn();
let notifications: AppNotification[] = [];

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/",
  useRouter: () => ({ replace: replaceSpy, push: vi.fn() }),
}));

vi.mock("@/lib/api/queries", () => ({
  useNotifications: () => ({ data: notifications, isLoading: false, error: null }),
  useMarkNotificationRead: () => ({ mutate: markReadSpy, isPending: false }),
  useMarkAllNotificationsRead: () => ({ mutate: markAllReadSpy, isPending: false }),
  useDeleteNotification: () => ({ mutate: removeSpy, isPending: false }),
  useDeleteAllNotifications: () => ({ mutate: removeAllSpy, isPending: false }),
}));

function notification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: "n-1",
    type: "approval_requested",
    title: "Dana Holt requested vacation",
    body: "12 Aug 2026 · 1 day",
    href: "http://localhost:3000/requests/?vacationId=v-1",
    readAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("NotificationsBell", () => {
  beforeEach(() => {
    replaceSpy.mockClear();
    markReadSpy.mockClear();
    markAllReadSpy.mockClear();
    removeSpy.mockClear();
    removeAllSpy.mockClear();
    notifications = [];
    window.history.replaceState({}, "", "/dashboard/");
  });

  it("renders the bell trigger without an unread dot when empty", () => {
    renderWithClient(<NotificationsBell />);
    expect(screen.getByRole("button", { name: /Notifications/i })).toBeInTheDocument();
  });

  it("opens a request on the current page instead of navigating to /requests", async () => {
    notifications = [notification()];
    renderWithClient(<NotificationsBell />);

    await userEvent.click(screen.getByRole("button", { name: /Notifications/i }));
    await userEvent.click(screen.getByText("Dana Holt requested vacation"));

    expect(markReadSpy).toHaveBeenCalledWith("n-1");
    expect(replaceSpy).toHaveBeenCalledWith("/dashboard/?vacationId=v-1", { scroll: false });
  });

  it("still follows a notification that points somewhere other than a request", async () => {
    notifications = [notification({ href: "/groups/?groupId=g-1", title: "Added to Platform" })];
    renderWithClient(<NotificationsBell />);

    await userEvent.click(screen.getByRole("button", { name: /Notifications/i }));

    // next/link normalises the trailing slash away outside the real app config.
    expect(screen.getByRole("link", { name: /Added to Platform/ })).toHaveAttribute(
      "href",
      "/groups?groupId=g-1"
    );
  });

  it("removes a single notification without following it", async () => {
    notifications = [notification()];
    renderWithClient(<NotificationsBell />);

    await userEvent.click(screen.getByRole("button", { name: /Notifications/i }));
    await userEvent.click(
      screen.getByRole("button", { name: /Remove notification: Dana Holt requested vacation/i })
    );

    expect(removeSpy).toHaveBeenCalledWith("n-1");
    expect(markReadSpy).not.toHaveBeenCalled();
    expect(replaceSpy).not.toHaveBeenCalled();
  });

  it("marks every notification read and clears them all from the header", async () => {
    notifications = [notification()];
    renderWithClient(<NotificationsBell />);

    await userEvent.click(screen.getByRole("button", { name: /Notifications/i }));
    await userEvent.click(screen.getByRole("button", { name: "Mark all read" }));
    await userEvent.click(screen.getByRole("button", { name: "Clear all" }));

    expect(markAllReadSpy).toHaveBeenCalledTimes(1);
    expect(removeAllSpy).toHaveBeenCalledTimes(1);
  });

  it("hides mark-all-read once nothing is unread, but keeps clear all", async () => {
    notifications = [notification({ readAt: new Date().toISOString() })];
    renderWithClient(<NotificationsBell />);

    await userEvent.click(screen.getByRole("button", { name: /Notifications/i }));

    expect(screen.queryByRole("button", { name: "Mark all read" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear all" })).toBeInTheDocument();
  });

  it("offers no bulk actions when there is nothing to act on", async () => {
    renderWithClient(<NotificationsBell />);

    await userEvent.click(screen.getByRole("button", { name: /Notifications/i }));

    expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark all read" })).not.toBeInTheDocument();
  });
});
