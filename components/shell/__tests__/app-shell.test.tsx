import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import { ToastHost } from "@/components/toast";
import {
  closeGroupEventSheet,
  groupEventSheetState,
  setShownGroupEventGroup,
} from "@/lib/group-events/sheet-store";
import { AppShell } from "../app-shell";
import {
  clockState,
  createdGroupEvent,
  groupEventGroups,
  resetShellState,
  roles,
  shellState,
} from "./shell-test-setup";

vi.mock("next/navigation", async () => {
  const { shellState } = await import("./shell-test-setup");
  return {
    usePathname: () => shellState.pathname,
    useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }),
  };
});
vi.mock("next-themes", () => ({ useTheme: () => ({ setTheme: vi.fn() }) }));
vi.mock("@/hooks/use-mobile", async () => {
  const { shellState } = await import("./shell-test-setup");
  return { useIsMobile: () => shellState.isMobile };
});
vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({
    data: { user: { id: "me", name: "Dana Holt", email: "dana@northwind.co" } },
    isPending: false,
  }),
  authClient: { signOut: vi.fn() },
}));
vi.mock("@/lib/support/use-support-admin", async () => {
  const { shellState } = await import("./shell-test-setup");
  return { useSupportAdmin: () => ({ supportAdmin: shellState.supportAdmin, isPending: false }) };
});
vi.mock("@/lib/viewer/use-viewer-roles", async () => {
  const { shellState } = await import("./shell-test-setup");
  return { useViewerRoles: () => shellState.roles };
});
vi.mock("@/lib/api/queries", async () => {
  const { queryMocks } = await import("./shell-test-setup");
  return queryMocks();
});

function sidebar() {
  return within(document.querySelector('[data-slot="sidebar"]') as HTMLElement);
}

function sectionLabels() {
  return Array.from(document.querySelectorAll('[data-sidebar="group-label"]')).map(
    (label) => label.textContent
  );
}

function sidebarLinkLabels() {
  return sidebar()
    .getAllByRole("link")
    .map((link) => link.textContent)
    .filter((label) => label !== "flexiday");
}

describe("AppShell", () => {
  beforeEach(resetShellState);

  it("renders the page inside the shell", () => {
    renderWithClient(
      <AppShell>
        <h1>Page body</h1>
      </AppShell>
    );
    expect(screen.getByRole("heading", { name: "Page body" })).toBeInTheDocument();
  });

  describe("sidebar", () => {
    it("shows Time off and Organization sections for an org admin, in mockup order", () => {
      shellState.roles = roles.orgAdmin;
      renderWithClient(<AppShell>x</AppShell>);

      expect(sectionLabels()).toEqual(["Time off", "Organization"]);
      expect(sidebarLinkLabels()).toEqual([
        "Dashboard",
        "Requests",
        "Report",
        "Groups",
        "Calendar sync",
        "Organization",
        "Billing",
        "Settings",
      ]);
    });

    it("shows the owner of a Pro organization the Directory entry with an Enterprise chip", () => {
      shellState.roles = roles.orgAdmin;
      shellState.directoryOrganizations = [
        {
          organizationId: "org-1",
          name: "Northwind",
          role: "OWNER",
          enabled: false,
          writable: false,
          newAgreementVersionReady: false,
        },
      ];
      renderWithClient(<AppShell>x</AppShell>);

      expect(sectionLabels()).toEqual(["Time off", "People", "Organization"]);
      expect(sidebar().getByRole("link", { name: /Directory/ })).toHaveTextContent(
        "DirectoryEnterprise"
      );
    });

    it("shows the Organization section for a group admin", () => {
      shellState.roles = roles.groupAdmin;
      renderWithClient(<AppShell>x</AppShell>);

      expect(sidebar().getByRole("link", { name: "Billing" })).toBeInTheDocument();
    });

    it("shows only Time off and Settings for a plain member", () => {
      renderWithClient(<AppShell>x</AppShell>);

      expect(sectionLabels()).toEqual(["Time off"]);
      expect(sidebar().queryByRole("link", { name: "Billing" })).not.toBeInTheDocument();
      expect(sidebarLinkLabels()).toEqual([
        "Dashboard",
        "Requests",
        "Report",
        "Groups",
        "Calendar sync",
        "Settings",
      ]);
    });

    it("has no Attendance section while the clock is not active", () => {
      shellState.roles = roles.orgAdmin;
      shellState.clock = { ...clockState, active: false };
      renderWithClient(<AppShell>x</AppShell>);

      expect(sectionLabels()).not.toContain("Attendance");
    });

    it("shows the Attendance section with My attendance once the clock is active", () => {
      shellState.clock = { ...clockState, active: true };
      renderWithClient(<AppShell>x</AppShell>);

      expect(sectionLabels()).toContain("Attendance");
      expect(sidebar().getByRole("link", { name: "My attendance" })).toHaveAttribute(
        "href",
        "/my-attendance"
      );
    });

    it("holds the admin section back while roles are loading", () => {
      shellState.roles = roles.loadingAdmin;
      renderWithClient(<AppShell>x</AppShell>);

      expect(sectionLabels()).toEqual(["Time off"]);
      expect(sidebar().queryByRole("link", { name: "Organization" })).not.toBeInTheDocument();
    });

    it("shows the Support link only for a support admin", () => {
      shellState.supportAdmin = true;
      renderWithClient(<AppShell>x</AppShell>);

      expect(sidebar().getByRole("link", { name: "Support" })).toBeInTheDocument();
    });

    it("hides the Support link for everyone else", () => {
      renderWithClient(<AppShell>x</AppShell>);

      expect(screen.queryByRole("link", { name: "Support" })).not.toBeInTheDocument();
    });

    it("marks the current page and keeps nested paths under their link", () => {
      shellState.pathname = "/groups/detail";
      renderWithClient(<AppShell>x</AppShell>);

      expect(sidebar().getByRole("link", { name: "Groups" })).toHaveAttribute(
        "aria-current",
        "page"
      );
      expect(sidebar().getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
        "aria-current"
      );
    });

    it("collapses and expands from the header button", () => {
      renderWithClient(<AppShell>x</AppShell>);

      const button = screen.getByRole("button", { name: "Collapse sidebar" });
      fireEvent.click(button);
      expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
      expect(document.querySelector('[data-slot="sidebar"]')).toHaveAttribute(
        "data-state",
        "collapsed"
      );
    });
  });

  describe("top bar", () => {
    it("shows the section and page as a breadcrumb", () => {
      shellState.pathname = "/report";
      renderWithClient(<AppShell>x</AppShell>);

      const crumb = screen.getByRole("navigation", { name: "Breadcrumb" });
      expect(crumb).toHaveTextContent("Time off/Report");
      expect(within(crumb).getByText("Report")).toHaveAttribute("aria-current", "page");
    });

    it("keeps the header actions", () => {
      renderWithClient(<AppShell>x</AppShell>);

      expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Toggle theme" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Switch to Czech" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /User menu/ })).toBeInTheDocument();
    });
  });

  describe("New menu", () => {
    afterEach(() => {
      closeGroupEventSheet();
      setShownGroupEventGroup(null);
      vi.useRealTimers();
    });

    async function openNewMenu() {
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "+ New" }));
      return { user, menu: within(screen.getByRole("menu")) };
    }

    it("keeps the plain + New Request while no group can create", () => {
      renderWithClient(<AppShell>x</AppShell>);

      expect(screen.getByRole("button", { name: "+ New Request" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "+ New" })).not.toBeInTheDocument();
    });

    it.each(["/dashboard", "/settings"])(
      "lists Time off request and Group event on %s when a group can create",
      async (pathname) => {
        shellState.pathname = pathname;
        shellState.groupEventGroups = groupEventGroups.creatable;
        renderWithClient(<AppShell>x</AppShell>);

        expect(screen.queryByRole("button", { name: "+ New Request" })).not.toBeInTheDocument();
        const { menu } = await openNewMenu();
        expect(menu.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
          "Time off request",
          "Group event",
        ]);
      }
    );

    it("opens the time off dialog from Time off request", async () => {
      shellState.groupEventGroups = groupEventGroups.creatable;
      renderWithClient(<AppShell>x</AppShell>);

      const { user, menu } = await openNewMenu();
      await user.click(menu.getByRole("menuitem", { name: "Time off request" }));
      expect(screen.getByRole("dialog", { name: "New Request" })).toBeInTheDocument();
    });

    it("opens the group event sheet on today with the group the dashboard shows", async () => {
      vi.useFakeTimers({ now: new Date(2026, 9, 18, 9), shouldAdvanceTime: true });
      shellState.groupEventGroups = groupEventGroups.creatable;
      setShownGroupEventGroup("g-2");
      renderWithClient(<AppShell>x</AppShell>);

      const { user, menu } = await openNewMenu();
      await user.click(menu.getByRole("menuitem", { name: "Group event" }));
      expect(groupEventSheetState()).toMatchObject({
        kind: "create",
        date: "2026-10-18",
        groupId: "g-2",
      });
    });

    it("leaves the group to the sheet's default away from the dashboard", async () => {
      shellState.pathname = "/settings";
      shellState.groupEventGroups = groupEventGroups.creatable;
      setShownGroupEventGroup("g-2");
      renderWithClient(<AppShell>x</AppShell>);

      const { user, menu } = await openNewMenu();
      await user.click(menu.getByRole("menuitem", { name: "Group event" }));
      expect(groupEventSheetState()).toMatchObject({ kind: "create", groupId: null });
    });

    async function createFromMenu() {
      const { user, menu } = await openNewMenu();
      await user.click(menu.getByRole("menuitem", { name: "Group event" }));
      const state = groupEventSheetState();
      if (state?.kind !== "create") throw new Error("sheet not open");
      act(() => state.onCreated?.(createdGroupEvent));
    }

    it("toasts with View on calendar after a create away from the dashboard", async () => {
      shellState.pathname = "/settings";
      shellState.groupEventGroups = groupEventGroups.creatable;
      renderWithClient(
        <>
          <ToastHost />
          <AppShell>x</AppShell>
        </>
      );

      await createFromMenu();
      expect(screen.getByText("Group event created")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "View on calendar" }).getAttribute("href")).toMatch(
        /^\/dashboard\/?\?groupId=g-2&month=2026-11$/
      );
    });

    it("toasts without a link after a create on the dashboard", async () => {
      shellState.groupEventGroups = groupEventGroups.creatable;
      renderWithClient(
        <>
          <ToastHost />
          <AppShell>x</AppShell>
        </>
      );

      await createFromMenu();
      expect(screen.getByText("Group event created")).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "View on calendar" })).not.toBeInTheDocument();
    });
  });

  it("carries the bottom bar, hidden by CSS from md up", () => {
    renderWithClient(<AppShell>x</AppShell>);

    expect(screen.getByRole("navigation", { name: "Menu" })).toHaveClass("md:hidden");
  });
});
