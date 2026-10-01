import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteAccountCard } from "../delete-account-card";
import { ApiError } from "@/lib/api/client";
import type { AccountDeletionStatus } from "@/lib/api/account-deletion";
import type { OrganizationSummary } from "@/lib/api/organization";
import { renderWithClient } from "@/lib/test-utils";

const getStatusMock = vi.fn<() => Promise<AccountDeletionStatus>>();
const deleteMock = vi.fn<(password?: string) => Promise<void>>();
vi.mock("@/lib/api/account-deletion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/account-deletion")>()),
  getAccountDeletionStatus: () => getStatusMock(),
  deleteMyAccount: (password?: string) => deleteMock(password),
}));

let organizations: OrganizationSummary[] = [];
vi.mock("@/lib/api/organization", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/organization")>()),
  listOrganizations: () => Promise.resolve(organizations),
}));

let sessionCreatedAt = new Date();
const signOutMock = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({
    data: { user: { email: "dana@example.com" }, session: { createdAt: sessionCreatedAt } },
  }),
  authClient: { signOut: () => signOutMock() },
}));

const openPortalMock = vi.fn();
vi.mock("@/lib/billing/use-open-billing-portal", () => ({
  useOpenBillingPortal: () => ({ open: openPortalMock, isPending: false }),
}));

const pushToastMock = vi.fn();
vi.mock("@/components/toast", () => ({
  pushToast: (...args: unknown[]) => pushToastMock(...args),
}));

let search = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => search,
}));

const DAY = 24 * 60 * 60 * 1000;

const PASSWORD_USER: AccountDeletionStatus = {
  canDelete: true,
  blockers: [],
  confirmation: "password",
};

const SOCIAL_USER: AccountDeletionStatus = {
  canDelete: true,
  blockers: [],
  confirmation: "recent-sign-in",
};

const EVERY_BLOCKER: AccountDeletionStatus = {
  canDelete: false,
  confirmation: "password",
  blockers: [
    { kind: "GROUP_HAS_MEMBERS", groupId: "g1", groupName: "Platform", otherMembers: 3 },
    {
      kind: "ORGANIZATION_HAS_MEMBERS",
      organizationId: "o1",
      organizationName: "Acme",
      otherMembers: 1,
    },
    { kind: "SUBSCRIPTION_RENEWING", organizationId: "o1", organizationName: "Acme" },
    { kind: "SUPPORT_ADMIN" },
  ],
};

function refusal(status: number, reason: string) {
  return new ApiError(status, "refused", undefined, [{ message: "refused", context: { reason } }]);
}

describe("DeleteAccountCard", () => {
  let replaceMock: ReturnType<typeof vi.fn>;
  let restoreLocation: () => void;

  beforeEach(() => {
    getStatusMock.mockReset();
    deleteMock.mockReset();
    signOutMock.mockReset();
    openPortalMock.mockReset();
    pushToastMock.mockReset();
    organizations = [];
    sessionCreatedAt = new Date();
    search = new URLSearchParams();
    // A plain stand-in: jsdom does not implement navigation.
    const original = Object.getOwnPropertyDescriptor(window, "location")!;
    replaceMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { replace: replaceMock, search: "" },
    });
    restoreLocation = () => Object.defineProperty(window, "location", original);
  });

  afterEach(() => {
    restoreLocation();
  });

  it("lists every blocker in plain words and keeps the delete button disabled", async () => {
    getStatusMock.mockResolvedValue(EVERY_BLOCKER);
    renderWithClient(<DeleteAccountCard layoutReady />);

    expect(await screen.findByText(/You manage the group Platform/)).toHaveTextContent(
      "3 other members"
    );
    expect(screen.getByText(/You own the organization Acme/)).toHaveTextContent(
      "1 other person still works"
    );
    expect(screen.getByText(/The subscription for Acme will renew/)).toHaveTextContent(
      "give up the rest of the paid period"
    );
    expect(screen.getByText("Support admin accounts can't be deleted here.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete account" })).toBeDisabled();
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
  });

  it("offers the billing portal for a renewing subscription", async () => {
    getStatusMock.mockResolvedValue(EVERY_BLOCKER);
    const user = userEvent.setup();
    renderWithClient(<DeleteAccountCard layoutReady />);

    await user.click(await screen.findByRole("button", { name: "Open billing portal" }));

    expect(openPortalMock).toHaveBeenCalled();
  });

  it("deletes a password user after a dialog that says what goes", async () => {
    getStatusMock.mockResolvedValue(PASSWORD_USER);
    deleteMock.mockResolvedValue(undefined);
    organizations = [
      { id: "o1", name: "Acme", isOwner: true },
      { id: "o2", name: "Globex", isOwner: false },
    ];
    const user = userEvent.setup();
    renderWithClient(<DeleteAccountCard layoutReady />);

    await user.type(await screen.findByLabelText("Password"), "hunter22");
    await user.click(screen.getByRole("button", { name: "Delete account" }));

    const dialog = await screen.findByRole("dialog", { name: "Delete your account?" });
    expect(dialog).toHaveTextContent("your leave and attendance records");
    expect(dialog).toHaveTextContent("the files attached to your requests");
    await waitFor(() =>
      expect(dialog).toHaveTextContent(
        "the organization Acme, with its groups and subscription record"
      )
    );
    expect(dialog).not.toHaveTextContent("Globex");
    expect(dialog).toHaveTextContent("This can't be undone.");
    expect(deleteMock).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Delete for good" }));

    expect(deleteMock).toHaveBeenCalledWith("hunter22");
    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith("/sign-in/?notice=account-deleted")
    );
  });

  it("names no organization for a user who owns none", async () => {
    getStatusMock.mockResolvedValue(PASSWORD_USER);
    const user = userEvent.setup();
    renderWithClient(<DeleteAccountCard layoutReady />);

    await user.type(await screen.findByLabelText("Password"), "hunter22");
    await user.click(screen.getByRole("button", { name: "Delete account" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).not.toHaveTextContent("organization");
  });

  it("shows a wrong password inline and deletes nothing", async () => {
    getStatusMock.mockResolvedValue(PASSWORD_USER);
    deleteMock.mockRejectedValue(refusal(403, "PASSWORD_INVALID"));
    const user = userEvent.setup();
    renderWithClient(<DeleteAccountCard layoutReady />);

    await user.type(await screen.findByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Delete account" }));
    await user.click(await screen.findByRole("button", { name: "Delete for good" }));

    expect(await screen.findByText("That password isn't right.")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
    expect(pushToastMock).not.toHaveBeenCalled();
  });

  it("re-reads the check on a 409 and shows the blockers", async () => {
    getStatusMock.mockResolvedValueOnce(PASSWORD_USER).mockResolvedValue(EVERY_BLOCKER);
    deleteMock.mockRejectedValue(refusal(409, "DELETION_BLOCKED"));
    const user = userEvent.setup();
    renderWithClient(<DeleteAccountCard layoutReady />);

    await user.type(await screen.findByLabelText("Password"), "hunter22");
    await user.click(screen.getByRole("button", { name: "Delete account" }));
    await user.click(await screen.findByRole("button", { name: "Delete for good" }));

    expect(await screen.findByText(/You manage the group Platform/)).toBeInTheDocument();
    expect(getStatusMock).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Delete account" })).toBeDisabled();
  });

  it("toasts any other failure", async () => {
    getStatusMock.mockResolvedValue(PASSWORD_USER);
    deleteMock.mockRejectedValue(new ApiError(500, "Server fell over"));
    const user = userEvent.setup();
    renderWithClient(<DeleteAccountCard layoutReady />);

    await user.type(await screen.findByLabelText("Password"), "hunter22");
    await user.click(screen.getByRole("button", { name: "Delete account" }));
    await user.click(await screen.findByRole("button", { name: "Delete for good" }));

    await waitFor(() => expect(pushToastMock).toHaveBeenCalledWith("Server fell over", "danger"));
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("asks a social-only user with an old session to sign in again", async () => {
    getStatusMock.mockResolvedValue(SOCIAL_USER);
    sessionCreatedAt = new Date(Date.now() - 2 * DAY);
    signOutMock.mockResolvedValue({ data: { success: true }, error: null });
    const user = userEvent.setup();
    renderWithClient(<DeleteAccountCard layoutReady />);

    await user.click(await screen.findByRole("button", { name: "Sign in again" }));

    expect(screen.queryByRole("button", { name: "Delete account" })).not.toBeInTheDocument();
    expect(signOutMock).toHaveBeenCalled();
    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith(
        `/sign-in/?redirect=${encodeURIComponent("/settings/?delete-account")}`
      )
    );
  });

  it("stays put when signing out fails", async () => {
    getStatusMock.mockResolvedValue(SOCIAL_USER);
    sessionCreatedAt = new Date(Date.now() - 2 * DAY);
    signOutMock.mockResolvedValue({ data: null, error: { message: "offline" } });
    const user = userEvent.setup();
    renderWithClient(<DeleteAccountCard layoutReady />);

    await user.click(await screen.findByRole("button", { name: "Sign in again" }));

    await waitFor(() =>
      expect(pushToastMock).toHaveBeenCalledWith("Could not sign you out. Try again.", "danger")
    );
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("lets a social-only user who just signed in delete without a password", async () => {
    getStatusMock.mockResolvedValue(SOCIAL_USER);
    deleteMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithClient(<DeleteAccountCard layoutReady />);

    await user.click(await screen.findByRole("button", { name: "Delete account" }));
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "Delete for good" }));

    expect(deleteMock).toHaveBeenCalledWith(undefined);
    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith("/sign-in/?notice=account-deleted")
    );
  });

  it("switches to sign in again when the backend wants a fresher sign-in", async () => {
    getStatusMock.mockResolvedValue(SOCIAL_USER);
    deleteMock.mockRejectedValue(refusal(403, "REAUTH_REQUIRED"));
    const user = userEvent.setup();
    renderWithClient(<DeleteAccountCard layoutReady />);

    await user.click(await screen.findByRole("button", { name: "Delete account" }));
    await user.click(await screen.findByRole("button", { name: "Delete for good" }));

    expect(await screen.findByRole("button", { name: "Sign in again" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete account" })).not.toBeInTheDocument();
  });

  it("says so when the check cannot be loaded", async () => {
    getStatusMock.mockRejectedValue(new ApiError(500, "boom"));
    renderWithClient(<DeleteAccountCard layoutReady />);

    expect(
      await screen.findByText(/Could not check whether your account can be deleted/)
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete account" })).not.toBeInTheDocument();
  });

  describe("the direct link", () => {
    let scrollIntoView: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      scrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoView as unknown as Element["scrollIntoView"];
      search = new URLSearchParams("delete-account");
      getStatusMock.mockResolvedValue(PASSWORD_USER);
    });

    afterEach(() => {
      delete (Element.prototype as Partial<Element>).scrollIntoView;
    });

    it("scrolls to the card and focuses it", async () => {
      renderWithClient(<DeleteAccountCard layoutReady />);

      const card = screen.getByRole("region", { name: "Delete account" });
      await waitFor(() => expect(card).toHaveFocus());
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
    });

    it("waits for the cards above to settle before scrolling", async () => {
      renderWithClient(<DeleteAccountCard layoutReady={false} />);

      await screen.findByLabelText("Password");
      expect(scrollIntoView).not.toHaveBeenCalled();
    });

    it("leaves the page alone without the link", async () => {
      search = new URLSearchParams();
      renderWithClient(<DeleteAccountCard layoutReady />);

      await screen.findByLabelText("Password");
      expect(scrollIntoView).not.toHaveBeenCalled();
    });
  });
});
