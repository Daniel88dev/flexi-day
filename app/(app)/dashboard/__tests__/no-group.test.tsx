import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "../page";
import { renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import { en } from "@/lib/i18n/dictionaries/en";

const TOKEN = "s3cr3t-token_abcdefghijklmnopqrstuvwxyz0123456";
const apiMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "u-dana", name: "Dana Holt" } } }),
}));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  api: (...args: unknown[]) => apiMock(...args),
}));

const platform = { id: "g-1", groupName: "Platform", holidayCountry: null };

const apiError = (status: number, message: string, context?: Record<string, unknown>) =>
  new ApiError(status, message, undefined, [{ message, context }]);

let memberships: (typeof platform)[];
let linkJoin: () => Promise<unknown>;
let codeJoin: () => Promise<unknown>;

const callsTo = (predicate: (path: string, init?: { method?: string }) => boolean) =>
  apiMock.mock.calls.filter(([path, init]) => predicate(path, init));
const linkJoins = () => callsTo((path) => path === "/api/auth/invite/join");
const codeJoins = () => callsTo((path) => path.startsWith("/api/group-user/code/"));

const join = async (value: string) => {
  const user = userEvent.setup();
  renderWithClient(<DashboardPage />);
  const field = await screen.findByLabelText("Invite link or code");
  // `paste` rather than `type`: the value is what a user pastes, and `type`
  // would read the braces in some links as key descriptors.
  await user.click(field);
  await user.paste(value);
  await user.click(screen.getByRole("button", { name: "Join group" }));
};

beforeEach(() => {
  vi.clearAllMocks();
  memberships = [];
  linkJoin = () => {
    memberships = [platform];
    return Promise.resolve({ id: "m-1", groupId: "g-1" });
  };
  codeJoin = () => {
    memberships = [platform];
    return Promise.resolve({ id: "m-1", groupId: "g-1" });
  };
  apiMock.mockImplementation((path: string, init?: { method?: string }) => {
    if (path === "/api/group" && init?.method === "POST") {
      memberships = [platform];
      return Promise.resolve({ id: "g-1", groupName: "Platform" });
    }
    if (path === "/api/group") return Promise.resolve(memberships);
    if (path === "/api/auth/invite/join") return linkJoin();
    if (path.startsWith("/api/group-user/code/")) return codeJoin();
    // Everything else the dashboard asks for stays loading; none of it is
    // under test here.
    return new Promise(() => {});
  });
});

describe("DashboardPage without a group", () => {
  it("offers a join field and a way to create a group, in place", async () => {
    renderWithClient(<DashboardPage />);

    expect(await screen.findByText("No groups yet")).toBeInTheDocument();
    expect(screen.getByLabelText("Invite link or code")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Join group" })).toBeInTheDocument();
    expect(screen.getByLabelText("Group name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create group" })).toBeInTheDocument();
  });

  it("redeems a pasted invite link by link, with the token in the body", async () => {
    await join(`  https://app.flexi-day.com/join/?token=${TOKEN} `);

    await waitFor(() => expect(linkJoins()).toHaveLength(1));
    expect(apiMock).toHaveBeenCalledWith("/api/auth/invite/join", {
      method: "POST",
      body: { token: TOKEN },
    });
    expect(codeJoins()).toHaveLength(0);
  });

  it("redeems a bare code by code", async () => {
    await join(" ABCD-EFGH-JKLM ");

    await waitFor(() => expect(codeJoins()).toHaveLength(1));
    expect(apiMock).toHaveBeenCalledWith("/api/group-user/code/ABCD-EFGH-JKLM", {
      method: "POST",
    });
    expect(linkJoins()).toHaveLength(0);
  });

  it("shows the joined group's dashboard once the join lands", async () => {
    await join("ABCD-EFGH-JKLM");

    await waitFor(() => expect(screen.queryByText("No groups yet")).not.toBeInTheDocument());
    expect(screen.queryByLabelText("Invite link or code")).not.toBeInTheDocument();
  });

  it("translates the refusal of a code for an unverified address", async () => {
    codeJoin = () =>
      Promise.reject(
        apiError(403, "Verify your email address before joining a team", {
          code: "EMAIL_NOT_VERIFIED_USE_INVITE_LINK",
        })
      );

    await join("ABCD-EFGH-JKLM");

    expect(
      await screen.findByText(
        "Use the Join button in your invite email, or confirm your address first."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Verify your email address before joining a team")
    ).not.toBeInTheDocument();
  });

  it("says why a pasted link was refused", async () => {
    linkJoin = () => Promise.reject(apiError(410, "Invite expired", { code: "INVITE_EXPIRED" }));

    await join(`https://app.flexi-day.com/join/?token=${TOKEN}`);

    expect(
      await screen.findByText(
        "This invite has expired. Ask your group admin to send you a new invite."
      )
    ).toBeInTheDocument();
  });

  it("shows the plan-limit message when the group is full", async () => {
    linkJoin = () =>
      Promise.reject(apiError(402, "limit", { reason: "PLAN_LIMIT", limit: 10, current: 10 }));

    await join(`https://app.flexi-day.com/join/?token=${TOKEN}`);

    expect(await screen.findByText(en.billing.memberLimitReached(10))).toBeInTheDocument();
  });

  it("sends nothing for a join link that lost its token", async () => {
    await join("https://app.flexi-day.com/join/");

    expect(
      await screen.findByText(
        "This invite link is incomplete or wrong. Open it again from your invite email."
      )
    ).toBeInTheDocument();
    expect(linkJoins()).toHaveLength(0);
    expect(codeJoins()).toHaveLength(0);
  });

  it("creates a group from the dashboard", async () => {
    const user = userEvent.setup();
    renderWithClient(<DashboardPage />);

    await user.type(await screen.findByLabelText("Group name"), "Platform");
    await user.click(screen.getByRole("button", { name: "Create group" }));

    await waitFor(() =>
      expect(apiMock).toHaveBeenCalledWith("/api/group", {
        method: "POST",
        body: expect.objectContaining({ groupName: "Platform" }),
      })
    );
    await waitFor(() => expect(screen.queryByText("No groups yet")).not.toBeInTheDocument());
  });
});
