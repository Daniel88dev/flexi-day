import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import SupportGroupPage from "../page";
import { renderWithClient } from "@/lib/test-utils";

const searchParamsState = { params: new URLSearchParams({ groupId: "g-1" }) };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => searchParamsState.params,
}));

vi.mock("@/lib/support/use-support-admin", () => ({
  useSupportAdmin: () => ({ supportAdmin: true, isPending: false }),
}));

vi.mock("@/lib/api/queries", () => ({
  useSupportGroup: () => ({
    data: {
      group: {
        id: "g-1",
        groupName: "Platform",
        organizationId: "org-1",
        organizationName: "Acme",
        managerUserId: "u-1",
        mainApprovalUser: "u-2",
        tempApprovalUser: null,
        defaultVacationDays: 20,
        defaultHomeOfficeDays: 2,
        workingDays: [1, 2, 3, 4, 5],
        holidayCountry: "CZ",
        deletedAt: null,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      members: [
        {
          userId: "u-3",
          name: "Member One",
          email: "member@example.com",
          viewAccess: false,
          adminAccess: false,
          approverAccess: false,
          controlledUser: false,
          deletedAt: "2026-02-01T00:00:00.000Z",
        },
      ],
      quotas: [
        {
          userId: "u-3",
          relatedYear: "2026",
          vacationDays: 20,
          homeOfficeDays: 0,
          carriedOverDays: 3,
        },
      ],
      vacations: [
        {
          id: "v-1",
          userId: "u-3",
          userName: "Member One",
          requestedDay: "2026-08-01",
          vacationType: "VACATION",
          halfDay: false,
          approvedAt: null,
          approvedBy: null,
          rejectedAt: "2026-07-01T00:00:00.000Z",
          deletedAt: null,
          createdAt: "2026-06-01T00:00:00.000Z",
        },
      ],
    },
    isLoading: false,
    error: null,
  }),
}));

describe("SupportGroupPage", () => {
  it("explains a missing groupId instead of loading forever", () => {
    searchParamsState.params = new URLSearchParams();
    try {
      renderWithClient(<SupportGroupPage />);
      expect(screen.getByText(/No group id/)).toBeInTheDocument();
      expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
    } finally {
      searchParamsState.params = new URLSearchParams({ groupId: "g-1" });
    }
  });

  it("renders group, removed members, quotas and vacation state", () => {
    renderWithClient(<SupportGroupPage />);
    expect(screen.getByRole("heading", { name: /Platform/ })).toBeInTheDocument();
    expect(screen.getByText("member@example.com")).toBeInTheDocument();
    // A removed membership stays visible, flagged rather than hidden.
    expect(screen.getByText(/removed/)).toBeInTheDocument();
    expect(screen.getByText("rejected")).toBeInTheDocument();
  });
});
