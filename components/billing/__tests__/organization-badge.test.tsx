import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrganizationBadge } from "../organization-badge";
import type { GroupOrganization } from "@/lib/api/types";

const organization = (overrides: Partial<GroupOrganization> = {}): GroupOrganization => ({
  id: "org-1",
  name: "Acme",
  plan: "PRO",
  status: "active",
  active: true,
  ...overrides,
});

describe("OrganizationBadge", () => {
  it("renders nothing without an organization", () => {
    const { container } = render(<OrganizationBadge organization={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("names the organization and its plan on an active subscription", () => {
    render(<OrganizationBadge organization={organization()} />);
    expect(screen.getByText("Acme · Pro")).toBeInTheDocument();
  });

  it("marks a trial alongside the plan", () => {
    render(<OrganizationBadge organization={organization({ status: "trialing" })} />);
    expect(screen.getByText("Acme · Pro")).toBeInTheDocument();
    expect(screen.getByText("Trial")).toBeInTheDocument();
  });

  it("drops to plain text on a free organization", () => {
    render(
      <OrganizationBadge
        organization={organization({ plan: "FREE", status: null, active: false })}
      />
    );
    expect(screen.getByText("Acme · Free plan")).toBeInTheDocument();
    expect(screen.queryByText("lapsed")).not.toBeInTheDocument();
  });

  it("warns during the grace window, while the plan still works", () => {
    // Paid entitlements survive grace, so `active` stays true — the status is
    // the only thing that says the card failed, and members never see the
    // owner-only grace banner.
    render(<OrganizationBadge organization={organization({ status: "past_due", active: true })} />);
    expect(screen.getByText("Acme · Pro")).toBeInTheDocument();
    expect(screen.getByText("payment issue")).toBeInTheDocument();
  });

  it("does not flag a comped organization held at Free", () => {
    // A manual FREE override is writable: false with an "active" status; that
    // is an intentional comp, not a payment failure.
    render(
      <OrganizationBadge
        organization={organization({ plan: "FREE", status: "active", active: false })}
      />
    );
    expect(screen.queryByText("lapsed")).not.toBeInTheDocument();
    expect(screen.queryByText("payment issue")).not.toBeInTheDocument();
  });

  it("flags a lapsed subscription", () => {
    // Grace has run out, so the backend already resolved the plan back to Free
    // — the badge must not keep claiming Pro.
    render(
      <OrganizationBadge
        organization={organization({ plan: "FREE", status: "past_due", active: false })}
      />
    );
    expect(screen.getByText("Acme · Free plan")).toBeInTheDocument();
    expect(screen.getByText("lapsed")).toBeInTheDocument();
  });
});
