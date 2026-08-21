import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { GroupCard } from "../group-card";
import { renderWithClient } from "@/lib/test-utils";
import type { GroupListItem } from "@/lib/api/types";

const base: GroupListItem = {
  id: "g-1",
  organizationId: "org-1",
  organization: null,
  groupName: "Platform",
  defaultVacationDays: 25,
  defaultHomeOfficeDays: 150,
  workingDays: [1, 2, 3, 4, 5],
  holidayCountry: null,
  managerUserId: "u-owner",
  mainApprovalUser: null,
  tempApprovalUser: null,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  memberCount: 4,
  membership: { adminAccess: false, approverAccess: false },
};

describe("GroupCard", () => {
  it("shows the member count and defaults", () => {
    renderWithClient(<GroupCard group={base} userId="u-member" />);

    expect(screen.getByText("4 members")).toBeInTheDocument();
    expect(screen.getByText(/Default vacation 25d/)).toBeInTheDocument();
  });

  it("labels the manager and offers the admin quick links", () => {
    renderWithClient(<GroupCard group={base} userId="u-owner" />);

    expect(screen.getByText("Manager")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Invites/ })).toHaveAttribute(
      "href",
      "/groups/detail?groupId=g-1&tab=invites"
    );
    expect(screen.getByRole("link", { name: /Settings/ })).toHaveAttribute(
      "href",
      "/groups/detail?groupId=g-1&tab=settings"
    );
  });

  it("labels a non-manager admin as Admin, with the admin quick links", () => {
    renderWithClient(
      <GroupCard
        group={{ ...base, membership: { adminAccess: true, approverAccess: false } }}
        userId="u-member"
      />
    );

    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Settings/ })).toBeInTheDocument();
  });

  it("hides role badge and admin links from a plain member", () => {
    renderWithClient(<GroupCard group={base} userId="u-member" />);

    expect(screen.queryByText("Manager")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Invites/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Settings/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Members/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Quotas/ })).toBeInTheDocument();
  });

  it("survives a backend that does not send memberCount/membership yet", () => {
    // The repos deploy independently; the list endpoint may lag the frontend.
    const legacy: GroupListItem = { ...base, memberCount: undefined, membership: undefined };

    renderWithClient(<GroupCard group={legacy} userId="u-member" />);

    expect(screen.getByRole("link", { name: "Platform" })).toBeInTheDocument();
    expect(screen.queryByText(/members/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Settings/ })).not.toBeInTheDocument();
  });

  it("labels an approver", () => {
    renderWithClient(
      <GroupCard
        group={{ ...base, membership: { adminAccess: false, approverAccess: true } }}
        userId="u-member"
      />
    );

    expect(screen.getByText("Approver")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Settings/ })).not.toBeInTheDocument();
  });
});
