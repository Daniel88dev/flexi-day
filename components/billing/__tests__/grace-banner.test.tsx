import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { GraceBanner } from "../grace-banner";
import { renderWithClient } from "@/lib/test-utils";
import type { BillingOverview } from "@/lib/api/billing";

let overview: BillingOverview | undefined;

vi.mock("@/lib/api/queries", () => ({
  useSubscription: () => ({ data: overview, isLoading: false, error: null }),
}));

const baseOverview = (): BillingOverview => ({
  organization: { id: "org-1", name: "Acme", billingEmail: "a@b.co", hasPaddleCustomer: true },
  subscription: null,
  entitlements: {
    plan: "FREE",
    maxGroups: 3,
    maxMembersPerGroup: 10,
    writable: true,
    graceEndsAt: null,
  },
  usage: { groupsUsed: 0, groups: [] },
  planLimits: {
    FREE: { groups: 3, membersPerGroup: 10, maxExtraSlots: 0 },
    PRO: { groups: 5, membersPerGroup: 25, maxExtraSlots: 4 },
    ENTERPRISE: { groups: 20, membersPerGroup: 100, maxExtraSlots: 20 },
  },
});

describe("GraceBanner", () => {
  beforeEach(() => {
    overview = baseOverview();
  });

  it("renders nothing for a healthy account", () => {
    const { container } = renderWithClient(<GraceBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing while the query has no data", () => {
    overview = undefined;
    const { container } = renderWithClient(<GraceBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("warns with the grace end date while grace is running", () => {
    overview!.entitlements.graceEndsAt = "2026-08-25T12:00:00.000Z";
    renderWithClient(<GraceBanner />);

    expect(screen.getByText(/problem with your subscription/i)).toBeInTheDocument();
    expect(screen.getByText(/25 August 2026/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review billing" })).toHaveAttribute(
      "href",
      "/billing"
    );
  });

  it("shows the read-only notice once grace has expired", () => {
    overview!.entitlements.writable = false;
    renderWithClient(<GraceBanner />);

    expect(screen.getByText(/read-only until you upgrade/i)).toBeInTheDocument();
  });
});
