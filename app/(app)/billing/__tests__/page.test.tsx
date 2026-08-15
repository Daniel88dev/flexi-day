import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BillingPage from "../page";
import { renderWithClient } from "@/lib/test-utils";
import type { BillingOverview } from "@/lib/api/billing";

const checkoutMutate = vi.fn();
const changePlanMutate = vi.fn();
const portalMutate = vi.fn();
const slotsMutate = vi.fn();

let overview: BillingOverview;

const baseOverview = (): BillingOverview => ({
  organization: null,
  subscription: null,
  entitlements: {
    plan: "FREE",
    maxGroups: 3,
    maxMembersPerGroup: 10,
    writable: true,
    graceEndsAt: null,
  },
  usage: { groupsUsed: 1, groups: [{ id: "g-1", groupName: "Platform", members: 4 }] },
  planLimits: {
    FREE: { groups: 3, membersPerGroup: 10, maxExtraSlots: 0 },
    PRO: { groups: 5, membersPerGroup: 25, maxExtraSlots: 4 },
    ENTERPRISE: { groups: 20, membersPerGroup: 100, maxExtraSlots: 20 },
  },
});

vi.mock("@/lib/api/queries", () => ({
  qk: { subscription: () => ["subscription"] as const },
  useSubscription: () => ({ data: overview, isLoading: false, error: null }),
  useCreateCheckout: () => ({ mutateAsync: checkoutMutate, isPending: false }),
  useChangePlan: () => ({ mutateAsync: changePlanMutate, isPending: false }),
  useCreatePortalSession: () => ({ mutateAsync: portalMutate, isPending: false }),
  useUpdateExtraSlots: () => ({ mutateAsync: slotsMutate, isPending: false }),
}));

const openCheckoutMock = vi.fn();
let paddleConfigured = true;
vi.mock("@/lib/paddle", () => ({
  openCheckout: (...args: unknown[]) => openCheckoutMock(...args),
  isPaddleConfigured: () => paddleConfigured,
}));

describe("BillingPage", () => {
  beforeEach(() => {
    overview = baseOverview();
    paddleConfigured = true;
    checkoutMutate.mockReset().mockResolvedValue({ transactionId: "txn-1" });
    openCheckoutMock.mockReset().mockResolvedValue(true);
    changePlanMutate.mockReset();
  });

  it("disables Subscribe when no Paddle client token is configured", () => {
    // Otherwise every click mints an orphaned Paddle transaction before the
    // overlay discovers it cannot open.
    paddleConfigured = false;
    renderWithClient(<BillingPage />);

    for (const button of screen.getAllByRole("button", { name: "Subscribe" })) {
      expect(button).toBeDisabled();
    }
  });

  it("shows the current plan and usage meters", () => {
    renderWithClient(<BillingPage />);

    expect(screen.getByRole("heading", { name: "Billing" })).toBeInTheDocument();
    expect(screen.getByText("1 of 3 groups used")).toBeInTheDocument();
    expect(screen.getByText("Platform")).toBeInTheDocument();
    // Appears as the card title and as the Free tier's disabled button.
    expect(screen.getAllByText("Current plan").length).toBeGreaterThan(0);
  });

  it("defaults the cycle toggle to yearly and shows ex-VAT yearly prices", () => {
    renderWithClient(<BillingPage />);

    expect(screen.getByText("€80")).toBeInTheDocument();
    expect(screen.getByText("€160")).toBeInTheDocument();
  });

  it("switches to monthly prices on toggle", async () => {
    const user = userEvent.setup();
    renderWithClient(<BillingPage />);

    await user.click(screen.getByRole("button", { name: "Monthly" }));
    expect(screen.getByText("€8")).toBeInTheDocument();
    expect(screen.getByText("€16")).toBeInTheDocument();
  });

  it("starts a checkout through the backend transaction and the overlay", async () => {
    const user = userEvent.setup();
    renderWithClient(<BillingPage />);

    const subscribeButtons = screen.getAllByRole("button", { name: "Subscribe" });
    await user.click(subscribeButtons[0]!);

    expect(checkoutMutate).toHaveBeenCalledWith({ plan: "PRO", billingCycle: "YEARLY" });
    expect(openCheckoutMock).toHaveBeenCalledWith("txn-1", expect.any(Function));
  });

  it("routes a past_due subscriber to the portal instead of a checkout that 409s", async () => {
    overview.subscription = {
      plan: "PRO",
      status: "past_due",
      billingCycle: "YEARLY",
      extraGroupSlots: 0,
      currentPeriodEnd: null,
      graceEndsAt: "2026-08-25T12:00:00.000Z",
      cancelAt: null,
    };
    overview.entitlements = {
      plan: "PRO",
      maxGroups: 5,
      maxMembersPerGroup: 25,
      writable: true,
      graceEndsAt: "2026-08-25T12:00:00.000Z",
    };
    overview.organization = {
      id: "org-1",
      name: "Acme",
      billingEmail: "a@b.co",
      hasPaddleCustomer: true,
    };

    renderWithClient(<BillingPage />);

    // The backend refuses both checkout and change-plan in past_due, so no
    // card may offer Subscribe.
    expect(screen.queryByRole("button", { name: "Subscribe" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Manage payment method/ }).length).toBeGreaterThan(
      0
    );
  });

  it("offers plan switching only while the subscription is active", () => {
    overview.subscription = {
      plan: "PRO",
      status: "active",
      billingCycle: "YEARLY",
      extraGroupSlots: 0,
      currentPeriodEnd: null,
      graceEndsAt: null,
      cancelAt: null,
    };
    overview.entitlements = {
      plan: "PRO",
      maxGroups: 5,
      maxMembersPerGroup: 25,
      writable: true,
      graceEndsAt: null,
    };

    renderWithClient(<BillingPage />);

    expect(screen.getByRole("button", { name: "Switch to this plan" })).toBeInTheDocument();
  });

  it("shows the grace warning while grace is running", () => {
    overview.entitlements.graceEndsAt = "2026-08-25T12:00:00.000Z";
    renderWithClient(<BillingPage />);

    expect(screen.getByText(/problem with your subscription/i)).toBeInTheDocument();
  });

  it("shows the read-only notice once grace has expired", () => {
    overview.entitlements.writable = false;
    renderWithClient(<BillingPage />);

    expect(screen.getByText(/read-only until you upgrade/i)).toBeInTheDocument();
  });
});
