import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { AssistantOrganization, WeeklyLimitState } from "@/lib/api/assistant";
import {
  AssistantUnavailable,
  LimitReached,
  NearLimit,
  OffGate,
  UpgradeGate,
} from "../limits-and-gates";

const limit = (overrides: Partial<WeeklyLimitState> = {}): WeeklyLimitState => ({
  percent: 84,
  reached: false,
  resetsAt: "2026-11-16T00:00:00.000Z",
  usedMicroUsd: null,
  limitMicroUsd: null,
  ...overrides,
});

const organization: AssistantOrganization = {
  organizationId: "org-acme",
  organizationName: "Acme",
  eligible: false,
  reason: null,
  planAllows: false,
  role: "owner",
  hasChats: false,
  weeklyLimit: null,
};

describe("NearLimit", () => {
  it("should show the percentage to a member", () => {
    render(<NearLimit organizationName="Acme" limit={limit()} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "84");
    expect(screen.getByText(/Acme has used 84% of this week's Assistant limit/)).toBeVisible();
  });

  it("should show the amounts where the viewer may see them", () => {
    render(
      <NearLimit
        organizationName="Acme"
        limit={limit({ usedMicroUsd: 8_400_000, limitMicroUsd: 10_000_000 })}
      />
    );
    expect(screen.getByText(/Acme has used .+ of its .+ Assistant limit this week/)).toBeVisible();
  });
});

describe("LimitReached", () => {
  it("should link to usage only for those who can see it", () => {
    const { rerender } = render(
      <LimitReached
        organizationName="Acme"
        limit={limit({ reached: true, percent: 100 })}
        canSeeUsage
        organizationId="org-acme"
      />
    );
    expect(screen.getByText(/The Assistant is paused until/)).toBeVisible();
    expect(screen.getByRole("link", { name: "See usage" })).toBeVisible();

    rerender(
      <LimitReached
        organizationName="Acme"
        limit={limit({ reached: true, percent: 100 })}
        canSeeUsage={false}
        organizationId="org-acme"
      />
    );
    expect(screen.queryByRole("link", { name: "See usage" })).not.toBeInTheDocument();
  });
});

describe("AssistantUnavailable", () => {
  it("should render a status", () => {
    render(<AssistantUnavailable />);
    expect(screen.getByRole("status")).not.toBeEmptyDOMElement();
  });
});

describe("UpgradeGate", () => {
  it("should offer Enterprise to the owner", () => {
    render(<UpgradeGate organization={organization} />);
    expect(
      screen.getByRole("heading", { name: "The Assistant comes with Enterprise" })
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "See Enterprise" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/billing/)
    );
  });
});

describe("OffGate", () => {
  it("should point to the organization settings", () => {
    render(<OffGate organization={{ ...organization, planAllows: true }} />);
    expect(screen.getByRole("heading", { name: "The Assistant is off for Acme" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Open organization settings" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/organization/)
    );
  });
});
