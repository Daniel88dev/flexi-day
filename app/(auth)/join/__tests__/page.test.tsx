import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import JoinPage, { metadata } from "../page";
import { renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import type { InvitePreview } from "@/lib/api/types";

const TOKEN = "s3cr3t-token_abcdefghijklmnopqrstuvwxyz0123456";
const SIGN_IN_HREF = `/sign-in?redirect=${encodeURIComponent(`/join/?token=${TOKEN}`)}`;

const replaceMock = vi.fn();
const signOutMock = vi.fn();
const apiMock = vi.fn();

let search = new URLSearchParams();
let session: { user: { id: string; email: string } } | null = null;

vi.mock("next/navigation", () => ({
  useSearchParams: () => search,
  useRouter: () => ({ replace: replaceMock, refresh: vi.fn() }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: session, isPending: false }),
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  api: (...args: unknown[]) => apiMock(...args),
}));

const openInvite = (overrides: Partial<InvitePreview> = {}): InvitePreview => ({
  groupId: "g-1",
  groupName: "Platform",
  inviterName: "Owen Owner",
  invitedEmail: "dana@northwind.co",
  status: "open",
  expiresAt: "2026-10-09T00:00:00.000Z",
  ...overrides,
});

const apiError = (status: number, context?: Record<string, unknown>) =>
  new ApiError(status, "refused", undefined, [{ message: "refused", context }]);

let previewResult: () => Promise<unknown>;
let groupsResult: { id: string }[];
let joinResult: () => Promise<unknown>;

const joinCalls = () =>
  apiMock.mock.calls.filter(([path]) => path === "/api/auth/invite/join").length;

beforeEach(() => {
  vi.clearAllMocks();
  search = new URLSearchParams({ token: TOKEN });
  session = null;
  previewResult = () => Promise.resolve(openInvite());
  groupsResult = [];
  joinResult = () => Promise.resolve({ id: "m-1", groupId: "g-1" });
  signOutMock.mockResolvedValue({});
  apiMock.mockImplementation((path: string) => {
    if (path === "/api/auth/invite/preview") return previewResult();
    if (path === "/api/group") return Promise.resolve(groupsResult);
    if (path === "/api/auth/invite/join") return joinResult();
    return Promise.reject(new Error(`unexpected request ${path}`));
  });
});

const signInAs = (email: string) => {
  session = { user: { id: "u-1", email } };
};

describe("JoinPage", () => {
  it("sends no Referer, since its URL carries the invite secret", () => {
    expect(metadata.referrer).toBe("no-referrer");
  });

  it("asks the preview about the token from the link, in the body", async () => {
    renderWithClient(<JoinPage />);

    expect(await screen.findByText("Join Platform")).toBeInTheDocument();
    expect(apiMock).toHaveBeenCalledWith("/api/auth/invite/preview", {
      method: "POST",
      body: { token: TOKEN },
    });
  });

  describe("signed in as the invited address", () => {
    beforeEach(() => signInAs("Dana@Northwind.co"));

    it("shows the group and inviter with one Join button, and joins only on the click", async () => {
      const user = userEvent.setup();
      renderWithClient(<JoinPage />);

      expect(await screen.findByText("Join Platform")).toBeInTheDocument();
      expect(
        screen.getByText("Owen Owner invited you to this group on flexiday.")
      ).toBeInTheDocument();
      expect(joinCalls()).toBe(0);

      await user.click(screen.getByRole("button", { name: /Join group/ }));

      expect(apiMock).toHaveBeenCalledWith("/api/auth/invite/join", {
        method: "POST",
        body: { token: TOKEN },
      });
      await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/dashboard"));
    });

    it("shows the plan-limit message when the group is full", async () => {
      joinResult = () =>
        Promise.reject(apiError(402, { reason: "PLAN_LIMIT", limit: 10, current: 10 }));
      const user = userEvent.setup();
      renderWithClient(<JoinPage />);

      await user.click(await screen.findByRole("button", { name: /Join group/ }));

      expect(await screen.findByText("This group is at its 10-member limit.")).toBeInTheDocument();
      expect(replaceMock).not.toHaveBeenCalled();
    });

    it("says the invite was used when someone got there first", async () => {
      joinResult = () => Promise.reject(apiError(410, { code: "INVITE_USED" }));
      const user = userEvent.setup();
      renderWithClient(<JoinPage />);

      await user.click(await screen.findByRole("button", { name: /Join group/ }));

      expect(await screen.findByText("This invite has been used")).toBeInTheDocument();
    });

    it("says so when the join finds them already a member", async () => {
      joinResult = () => Promise.reject(apiError(409, { code: "ALREADY_MEMBER", groupId: "g-1" }));
      const user = userEvent.setup();
      renderWithClient(<JoinPage />);

      await user.click(await screen.findByRole("button", { name: /Join group/ }));

      expect(await screen.findByText("You're already in this group")).toBeInTheDocument();
    });

    it("takes a member straight to the group instead of offering to join", async () => {
      groupsResult = [{ id: "g-1" }];
      previewResult = () => Promise.resolve(openInvite({ status: "used" }));
      renderWithClient(<JoinPage />);

      expect(await screen.findByText("You're already in this group")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Open the group/ })).toHaveAttribute(
        "href",
        "/groups/detail?groupId=g-1"
      );
      expect(screen.queryByRole("button", { name: /Join group/ })).not.toBeInTheDocument();
    });
  });

  describe("signed in as someone else", () => {
    beforeEach(() => signInAs("sam@elsewhere.io"));

    it("names the invited address masked, and offers to sign out and continue", async () => {
      const user = userEvent.setup();
      renderWithClient(<JoinPage />);

      expect(await screen.findByText("This invite is for another account")).toBeInTheDocument();
      expect(
        screen.getByText(
          "This invite is for d…@northwind.co. You're signed in as sam@elsewhere.io."
        )
      ).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Join group/ })).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Sign out and continue" }));

      expect(signOutMock).toHaveBeenCalled();
      await waitFor(() => expect(replaceMock).toHaveBeenCalledWith(SIGN_IN_HREF));
      expect(joinCalls()).toBe(0);
    });
  });

  describe("signed out", () => {
    it("sends the visitor to sign in and back here with the token", async () => {
      renderWithClient(<JoinPage />);

      expect(await screen.findByText("Join Platform")).toBeInTheDocument();
      expect(
        screen.getByText("Sign in as dana@northwind.co to accept the invite.")
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Sign in to join/ })).toHaveAttribute(
        "href",
        SIGN_IN_HREF
      );
      expect(apiMock).not.toHaveBeenCalledWith("/api/group");
      expect(joinCalls()).toBe(0);
    });
  });

  describe("an invite that can no longer be used", () => {
    it.each([
      ["used", "This invite has been used"],
      ["expired", "This invite has expired"],
      ["revoked", "This invite is no longer valid"],
    ] as const)("says the invite is %s", async (status, title) => {
      signInAs("dana@northwind.co");
      previewResult = () => Promise.resolve(openInvite({ status }));
      renderWithClient(<JoinPage />);

      expect(await screen.findByText(title)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Join group/ })).not.toBeInTheDocument();
      expect(joinCalls()).toBe(0);
    });

    it("says the invite was not found for an unknown token", async () => {
      previewResult = () => Promise.reject(apiError(404, { code: "INVITE_NOT_FOUND" }));
      renderWithClient(<JoinPage />);

      expect(await screen.findByText("Invite not found")).toBeInTheDocument();
    });

    it("says the invite was not found when the link lost its token", async () => {
      search = new URLSearchParams();
      renderWithClient(<JoinPage />);

      expect(await screen.findByText("Invite not found")).toBeInTheDocument();
      expect(apiMock).not.toHaveBeenCalled();
    });
  });
});
