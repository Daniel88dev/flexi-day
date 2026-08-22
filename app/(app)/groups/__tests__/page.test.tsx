import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import GroupsPage from "../page";
import { renderWithClient } from "@/lib/test-utils";

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

vi.mock("@/lib/api/queries", () => ({
  useGroups: () => ({ data: groups, isLoading: false, error: null }),
  useCreateGroup: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useJoinGroup: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSubscription: () => ({ data: undefined, isLoading: false, error: null }),
}));

describe("GroupsPage", () => {
  it("renders the create and join cards and the group list", () => {
    renderWithClient(<GroupsPage />);

    expect(screen.getByText("Create a group")).toBeInTheDocument();
    expect(screen.getByText("Join with code")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Platform" })).toBeInTheDocument();
    expect(screen.getByText("3 members")).toBeInTheDocument();
    expect(screen.getByText("Manager")).toBeInTheDocument();
  });
});
