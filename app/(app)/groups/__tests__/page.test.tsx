import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupsPage from "../page";
import { renderWithClient } from "@/lib/test-utils";
import type { BillingOverview } from "@/lib/api/billing";
import { ApiError } from "@/lib/api/client";

const groups = [
  {
    id: "g-1",
    organizationId: "org-1",
    organization: null,
    groupName: "Platform",
    defaultVacationDays: 25,
    defaultHomeOfficeDays: 150,
    workingDays: [1, 2, 3, 4, 5],
    holidayCountry: null,
    managerUserId: "u-1",
    mainApprovalUser: null,
    tempApprovalUser: null,
    deletedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    memberCount: 3,
    membership: { adminAccess: true, approverAccess: true },
  },
];

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "u-1" } } }),
}));

let billing: BillingOverview | undefined;
const joinByCode = vi.fn();
const joinByLink = vi.fn();

const overviewAs = (isOwner: boolean, groupsUsed = 1): BillingOverview => ({
  organization: {
    id: "org-1",
    name: "Acme",
    isOwner,
    billingEmail: isOwner ? "a@b.co" : null,
    hasPaddleCustomer: false,
  },
  subscription: null,
  entitlements: {
    plan: "PRO",
    maxGroups: 5,
    maxMembersPerGroup: 25,
    writable: true,
    graceEndsAt: null,
  },
  usage: { groupsUsed, activeEmployments: 1, groups: [] },
  planLimits: {
    FREE: { groups: 3, membersPerGroup: 10, maxExtraSlots: 0 },
    PRO: { groups: 5, membersPerGroup: 25, maxExtraSlots: 4 },
    ENTERPRISE: { groups: 20, membersPerGroup: 100, maxExtraSlots: 20 },
  },
});

vi.mock("@/lib/api/queries", () => ({
  useGroups: () => ({ data: groups, isLoading: false, error: null }),
  useCreateGroup: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useJoinGroup: () => ({ mutateAsync: joinByCode, isPending: false }),
  useJoinGroupByLink: () => ({ mutateAsync: joinByLink, isPending: false }),
  useSubscription: () => ({ data: billing, isLoading: false, error: null }),
}));

describe("GroupsPage", () => {
  beforeEach(() => {
    billing = undefined;
    joinByCode.mockReset().mockResolvedValue({ id: "m-1", groupId: "g-2" });
    joinByLink.mockReset().mockResolvedValue({ id: "m-1", groupId: "g-2" });
  });

  it("renders the create and join cards and the group list", () => {
    renderWithClient(<GroupsPage />);

    expect(screen.getByText("Create a group")).toBeInTheDocument();
    expect(screen.getByText("Join a group")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Platform" })).toBeInTheDocument();
    expect(screen.getByText("3 members")).toBeInTheDocument();
    expect(screen.getByText("Manager")).toBeInTheDocument();
  });

  it("shows the owner their own group allowance", () => {
    billing = overviewAs(true);
    renderWithClient(<GroupsPage />);

    expect(screen.getByText("1 of 5 groups used")).toBeInTheDocument();
  });

  it("blocks the owner at their group cap", () => {
    billing = overviewAs(true, 5);
    renderWithClient(<GroupsPage />);

    expect(screen.getByRole("link", { name: /Upgrade/ })).toBeInTheDocument();
  });

  it("applies neither the allowance nor the cap to a delegated admin", () => {
    // A new group lands in the creator's own organization, so the administered
    // org's usage says nothing about what they may create here — least of all
    // that they are out of room.
    billing = overviewAs(false, 5);
    renderWithClient(<GroupsPage />);

    expect(screen.queryByText(/groups used/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Upgrade/ })).not.toBeInTheDocument();
  });

  it("translates the refusal of a code for an unverified address", async () => {
    joinByCode.mockRejectedValue(
      new ApiError(403, "Verify your email address before joining a team", undefined, [
        {
          message: "Verify your email address before joining a team",
          context: { code: "EMAIL_NOT_VERIFIED_USE_INVITE_LINK" },
        },
      ])
    );
    const user = userEvent.setup();
    renderWithClient(<GroupsPage />);

    await user.type(screen.getByLabelText("Invite link or code"), "ABCD-EFGH-JKLM");
    await user.click(screen.getByRole("button", { name: "Join group" }));

    expect(joinByCode).toHaveBeenCalledWith("ABCD-EFGH-JKLM");
    expect(
      await screen.findByText(
        "Use the Join button in your invite email, or confirm your address first."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Verify your email address before joining a team")
    ).not.toBeInTheDocument();
  });

  it("joins by link when an invite link is pasted", async () => {
    const user = userEvent.setup();
    renderWithClient(<GroupsPage />);

    await user.click(screen.getByLabelText("Invite link or code"));
    await user.paste("https://app.flexi-day.com/join/?token=s3cr3t");
    await user.click(screen.getByRole("button", { name: "Join group" }));

    expect(joinByLink).toHaveBeenCalledWith("s3cr3t");
    expect(joinByCode).not.toHaveBeenCalled();
    expect(await screen.findByText("Joined group successfully.")).toBeInTheDocument();
  });
});
