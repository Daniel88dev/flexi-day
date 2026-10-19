import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AppNotification } from "@/lib/api/types";

let pathname = "/dashboard/";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "u-1" } }, isPending: false }),
}));

vi.mock("@/lib/api/notifications", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/notifications")>()),
  listNotifications: vi.fn(),
}));

import { listNotifications } from "@/lib/api/notifications";
import { QueryProvider } from "@/components/query-provider";
import { NotificationsBell } from "../notifications-bell";

const listMock = vi.mocked(listNotifications);
let serverNotifications: AppNotification[] = [];

function notification(id: string, createdAt = new Date().toISOString()): AppNotification {
  return {
    id,
    type: "approval_requested",
    title: `Request ${id}`,
    body: "12 Aug 2026 · 1 day",
    href: "/requests/?vacationId=v-1",
    readAt: null,
    createdAt,
  };
}

const tree = () => (
  <QueryProvider>
    <NotificationsBell />
  </QueryProvider>
);

function renderBell() {
  const view = render(tree());
  return { navigate: () => view.rerender(tree()) };
}

async function loadedWithOneUnread() {
  serverNotifications = [notification("n-1")];
  const view = renderBell();
  await screen.findByRole("button", { name: "Notifications (1 unread)" });
  serverNotifications = [notification("n-2"), notification("n-1")];
  return view;
}

// Just past the 30 s staleTime that QueryProvider gives every query.
const PAST_STALE_TIME = 31_000;

function makeStale() {
  vi.setSystemTime(Date.now() + PAST_STALE_TIME);
}

describe("NotificationsBell refresh", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    pathname = "/dashboard/";
    listMock.mockReset();
    listMock.mockImplementation(async () => serverNotifications);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("refetches a stale list when the tab becomes visible again", async () => {
    await loadedWithOneUnread();
    makeStale();

    act(() => {
      window.dispatchEvent(new Event("visibilitychange"));
    });

    expect(await screen.findByRole("button", { name: "Notifications (2 unread)" })).toBeVisible();
  });

  it("refetches a stale list after reconnecting", async () => {
    await loadedWithOneUnread();
    makeStale();

    act(() => {
      window.dispatchEvent(new Event("offline"));
      window.dispatchEvent(new Event("online"));
    });

    expect(await screen.findByRole("button", { name: "Notifications (2 unread)" })).toBeVisible();
  });

  it("refetches a stale list on an in-app route change", async () => {
    const view = await loadedWithOneUnread();
    makeStale();

    pathname = "/requests/";
    view.navigate();

    expect(await screen.findByRole("button", { name: "Notifications (2 unread)" })).toBeVisible();
  });

  it("leaves a fresh list alone on a route change", async () => {
    const view = await loadedWithOneUnread();

    pathname = "/requests/";
    view.navigate();

    expect(listMock).toHaveBeenCalledTimes(1);
  });

  it("refetches on opening the panel even when the list is fresh, keeping cached items", async () => {
    await loadedWithOneUnread();
    let resolve: (value: AppNotification[]) => void = () => {};
    listMock.mockImplementationOnce(() => new Promise((r) => (resolve = r)));

    await userEvent.click(screen.getByRole("button", { name: "Notifications (1 unread)" }));

    expect(listMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Request n-1")).toBeVisible();
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();

    await act(async () => resolve(serverNotifications));

    expect(await screen.findByText("Request n-2")).toBeVisible();
    // The open menu hides the rest of the page, trigger included, from the accessibility tree.
    expect(
      screen.getByRole("button", { name: "Notifications (2 unread)", hidden: true })
    ).toBeInTheDocument();
  });

  it("works out relative times against the time the panel opens", async () => {
    serverNotifications = [notification("n-1")];
    renderBell();
    const bell = await screen.findByRole("button", { name: "Notifications (1 unread)" });

    await userEvent.click(bell);
    expect(await screen.findByText("just now")).toBeVisible();
    await userEvent.keyboard("{Escape}");

    vi.setSystemTime(Date.now() + 5 * 60_000);
    await userEvent.click(bell);

    expect(await screen.findByText("5m ago")).toBeVisible();
  });
});
