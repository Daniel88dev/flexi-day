import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganizationScreen } from "../organization-screen";
import { renderWithClient } from "@/lib/test-utils";
import type { OrganizationDetail, OrganizationSummary } from "@/lib/api/organization";

let organizations: OrganizationSummary[];
let organizationsError: Error | null;
let detail: OrganizationDetail | undefined;
/** Per-organization detail, so the mock answers the id it is actually asked for. */
let detailsById: Record<string, OrganizationDetail> | null;
let candidates: { userId: string; user: { name: string }; groupNames: string[] }[];

const addAdmin = vi.fn();
const removeAdmin = vi.fn();
const updateOrganization = vi.fn();

vi.mock("@/lib/api/queries", () => ({
  useOrganizations: () => ({
    data: organizations,
    isLoading: false,
    error: organizationsError,
  }),
  useOrganization: (id?: string | null) => ({
    data: detailsById ? (id ? detailsById[id] : undefined) : detail,
    isLoading: false,
    error: null,
  }),
  useOrganizationCandidates: (_id: string | null, enabled: boolean) => ({
    data: enabled ? candidates : undefined,
    isLoading: false,
    error: null,
  }),
  useUpdateOrganization: () => ({ mutateAsync: updateOrganization, isPending: false }),
  useAddOrganizationAdmin: () => ({ mutateAsync: addAdmin, isPending: false }),
  useRemoveOrganizationAdmin: () => ({ mutateAsync: removeAdmin, isPending: false }),
}));

const admin = (userId: string, name: string, isOwner: boolean) => ({
  userId,
  email: `${userId}@acme.test`,
  isOwner,
  grantedAt: isOwner ? null : "2026-01-01T00:00:00.000Z",
  user: { id: userId, name, initials: "XX", avatarColor: "hsl(1, 65%, 50%)" },
});

const baseDetail = (): OrganizationDetail => ({
  organization: {
    id: "org-1",
    name: "Acme",
    isOwner: true,
    billingEmail: "billing@acme.test",
    sickDayBenefitEnabled: false,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  plan: {
    plan: "PRO",
    status: "active",
    writable: true,
    graceEndsAt: null,
    maxGroups: 5,
    maxMembersPerGroup: 25,
  },
  groups: [
    { id: "g-1", groupName: "Engineering", members: 4, createdAt: "2026-01-02T00:00:00.000Z" },
  ],
  admins: [admin("owner-1", "Olivia Owner", true), admin("del-1", "Dana Delegate", false)],
  viewer: { userId: "owner-1" },
});

describe("OrganizationScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    organizations = [{ id: "org-1", name: "Acme", isOwner: true }];
    organizationsError = null;
    detail = baseDetail();
    detailsById = null;
    candidates = [
      { userId: "cand-1", user: { name: "Cody Candidate" }, groupNames: ["Engineering"] },
    ];
  });

  it("prompts to create a group when the user has no organization", () => {
    organizations = [];
    renderWithClient(<OrganizationScreen />);
    expect(screen.getByText(/don't have an organization yet/i)).toBeInTheDocument();
  });

  it("reports a failed load instead of claiming there is no organization", () => {
    organizations = [];
    organizationsError = new Error("boom");

    renderWithClient(<OrganizationScreen />);

    expect(screen.getByText(/Couldn't load your organization/i)).toBeInTheDocument();
    expect(screen.queryByText(/don't have an organization yet/i)).not.toBeInTheDocument();
  });

  it("carries no form state across an organization switch", async () => {
    // The form seeds from the detail via useState, so without a key the cards
    // survive the switch and Save would write one organization's name onto
    // the other.
    const user = userEvent.setup();
    organizations = [
      { id: "org-1", name: "Acme", isOwner: true },
      { id: "org-2", name: "Globex", isOwner: true },
    ];
    detailsById = {
      "org-1": baseDetail(),
      "org-2": {
        ...baseDetail(),
        organization: { ...baseDetail().organization, id: "org-2", name: "Globex" },
      },
    };

    renderWithClient(<OrganizationScreen />);
    expect(screen.getByLabelText("Organization name")).toHaveValue("Acme");

    await user.click(screen.getByRole("button", { name: /Globex/ }));
    expect(screen.getByLabelText("Organization name")).toHaveValue("Globex");

    await user.click(screen.getByRole("button", { name: /Acme/ }));
    expect(screen.getByLabelText("Organization name")).toHaveValue("Acme");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  it("shows the plan, its limits and the group list", () => {
    renderWithClient(<OrganizationScreen />);

    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("5 groups · 25 people per group")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText(/4 members/)).toBeInTheDocument();
  });

  it("hides the switcher for a single organization", () => {
    renderWithClient(<OrganizationScreen />);
    expect(screen.queryByText("Organization", { selector: "span" })).not.toBeInTheDocument();
  });

  it("offers a switcher once the viewer administers more than one", () => {
    organizations = [
      { id: "org-1", name: "Acme", isOwner: true },
      { id: "org-2", name: "Globex", isOwner: false },
    ];
    renderWithClient(<OrganizationScreen />);
    expect(screen.getByRole("button", { name: /Globex/ })).toBeInTheDocument();
  });

  describe("as the owner", () => {
    it("offers the billing email and a link to billing", () => {
      renderWithClient(<OrganizationScreen />);

      expect(screen.getByLabelText("Billing email")).toHaveValue("billing@acme.test");
      expect(screen.getByRole("link", { name: "Manage billing" })).toBeInTheDocument();
    });

    it("saves only the fields that actually changed", async () => {
      const user = userEvent.setup();
      renderWithClient(<OrganizationScreen />);

      await user.clear(screen.getByLabelText("Organization name"));
      await user.type(screen.getByLabelText("Organization name"), "Acme Inc");
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(updateOrganization).toHaveBeenCalledWith({ name: "Acme Inc" });
    });

    it("keeps the save button disabled until something changes", () => {
      renderWithClient(<OrganizationScreen />);
      expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    });

    it("promotes a candidate to administrator", async () => {
      const user = userEvent.setup();
      renderWithClient(<OrganizationScreen />);

      await user.selectOptions(screen.getByLabelText("Add administrator"), "cand-1");
      await user.click(screen.getByRole("button", { name: "Add administrator" }));

      expect(addAdmin).toHaveBeenCalledWith("cand-1");
    });

    it("removes a delegated admin but never the owner", async () => {
      const user = userEvent.setup();
      renderWithClient(<OrganizationScreen />);

      const removeButtons = screen.getAllByRole("button", { name: "Remove" });
      expect(removeButtons).toHaveLength(1);

      await user.click(removeButtons[0]!);
      expect(removeAdmin).toHaveBeenCalledWith("del-1");
    });

    it("says so when everyone is already an administrator", () => {
      candidates = [];
      renderWithClient(<OrganizationScreen />);
      expect(screen.getByText(/already an administrator/i)).toBeInTheDocument();
    });
  });

  describe("sick day benefit", () => {
    it("toggles the benefit on a paid plan", async () => {
      const user = userEvent.setup();
      renderWithClient(<OrganizationScreen />);

      const toggle = screen.getByRole("switch", { name: "Offer paid sick days" });
      expect(toggle).not.toBeDisabled();
      expect(toggle).not.toBeChecked();
      // The plan note explains a restriction; a paid organization has none.
      expect(screen.queryByText("Available on paid plans.")).not.toBeInTheDocument();

      await user.click(toggle);
      expect(updateOrganization).toHaveBeenCalledWith({ sickDayBenefitEnabled: true });
    });

    it("disables the toggle on the free plan and labels it paid-only", () => {
      const base = baseDetail();
      detail = { ...base, plan: { ...base.plan, plan: "FREE", status: null } };
      renderWithClient(<OrganizationScreen />);

      expect(screen.getByRole("switch", { name: "Offer paid sick days" })).toBeDisabled();
      expect(screen.getByText("Available on paid plans.")).toBeInTheDocument();
    });

    it("shows an enabled benefit as dormant after a lapse, still switchable off", () => {
      const base = baseDetail();
      detail = {
        ...base,
        organization: { ...base.organization, sickDayBenefitEnabled: true },
        plan: { ...base.plan, plan: "FREE", status: "canceled" },
      };
      renderWithClient(<OrganizationScreen />);

      const toggle = screen.getByRole("switch", { name: "Offer paid sick days" });
      expect(toggle).toBeChecked();
      expect(toggle).not.toBeDisabled();
      expect(screen.getByText(/dormant/i)).toBeInTheDocument();
    });

    it("hides the card when the backend predates the benefit", () => {
      const base = baseDetail();
      detail = {
        ...base,
        organization: { ...base.organization, sickDayBenefitEnabled: undefined },
      };
      renderWithClient(<OrganizationScreen />);

      expect(screen.queryByText("Sick day benefit")).not.toBeInTheDocument();
    });
  });

  describe("as a delegated admin", () => {
    beforeEach(() => {
      detail = {
        ...baseDetail(),
        organization: { ...baseDetail().organization, isOwner: false, billingEmail: null },
      };
    });

    it("hides the billing address and the billing link", () => {
      renderWithClient(<OrganizationScreen />);

      expect(screen.queryByLabelText("Billing email")).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Manage billing" })).not.toBeInTheDocument();
    });

    it("can still rename the organization", async () => {
      const user = userEvent.setup();
      renderWithClient(<OrganizationScreen />);

      await user.type(screen.getByLabelText("Organization name"), "!");
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(updateOrganization).toHaveBeenCalledWith({ name: "Acme!" });
    });

    it("cannot add or remove administrators", () => {
      renderWithClient(<OrganizationScreen />);

      expect(screen.getByText(/Only the owner can add or remove/i)).toBeInTheDocument();
      expect(screen.queryByLabelText("Add administrator")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
    });
  });
});
