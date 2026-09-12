import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import { renderWithClient } from "@/lib/test-utils";
import { BottomBar } from "../bottom-bar";
import { resetShellState, roles, shellState } from "./shell-test-setup";

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

function bar() {
  return screen.getByRole("navigation", { name: "Menu" });
}

function openMore() {
  fireEvent.click(screen.getByRole("button", { name: "More" }));
  return within(screen.getByRole("dialog"));
}

describe("BottomBar", () => {
  beforeEach(resetShellState);

  it("has five slots with the centre one held for the clock, and hides above md", () => {
    renderWithClient(<BottomBar />);

    expect(bar()).toHaveClass("md:hidden");

    const slots = Array.from(bar().children);
    expect(slots).toHaveLength(5);
    expect(slots.map((slot) => slot.textContent)).toEqual([
      "Dashboard",
      "Requests",
      "",
      "Report",
      "More",
    ]);
    expect(slots[2]).toHaveAttribute("data-slot", "bottom-bar-clock-slot");
  });

  it("marks the current tab", () => {
    shellState.pathname = "/requests";
    renderWithClient(<BottomBar />);

    expect(within(bar()).getByRole("link", { name: "Requests" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("lists the remaining links behind More for a member", () => {
    renderWithClient(<BottomBar />);
    const sheet = openMore();

    // The open sheet hides the rest of the page from assistive tech, so query the DOM directly.
    expect(document.querySelector('button[aria-label="More"]')).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(sheet.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Groups",
      "Calendar sync",
      "Settings",
    ]);
    expect(sheet.queryByText("Organization")).not.toBeInTheDocument();
    expect(sheet.getByRole("button", { name: "+ New Request" })).toBeInTheDocument();
    expect(sheet.getByRole("button", { name: "Toggle theme" })).toBeInTheDocument();
  });

  it("adds the Organization section and Support behind More for an admin", () => {
    shellState.roles = roles.orgAdmin;
    shellState.supportAdmin = true;
    renderWithClient(<BottomBar />);
    const sheet = openMore();

    expect(sheet.getByText("Organization", { selector: "div" })).toBeInTheDocument();
    expect(sheet.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Groups",
      "Calendar sync",
      "Organization",
      "Billing",
      "Settings",
      "Support",
    ]);
  });

  it("keeps admin links out of More while roles are loading", () => {
    shellState.roles = roles.loadingAdmin;
    renderWithClient(<BottomBar />);
    const sheet = openMore();

    expect(sheet.queryByRole("link", { name: "Billing" })).not.toBeInTheDocument();
  });

  it("closes More after picking a link", () => {
    renderWithClient(<BottomBar />);
    const sheet = openMore();

    fireEvent.click(sheet.getByRole("link", { name: "Groups" }));
    expect(screen.getByRole("button", { name: "More" })).toHaveAttribute("aria-expanded", "false");
  });
});
