import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import RequestsPage from "../page";
import { renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import { CalendarRecordType, type VacationListItem } from "@/lib/api/types";

// The caller administers Dev Support through the organization without being a
// member, so it is in the report scope but not in `GET /api/group`.
const SUPPORT = "5dd81205-4454-4cfa-a95e-4911bd1452bb";
const TEAM = "0b7e1c52-9d0a-4f3e-8a51-2c6d7e8f9a10";
const MIRROR_SOURCE = "7a1f0c3e-2b4d-4e6f-9a8b-1c2d3e4f5a6b";

const erin = { id: "u-erin", name: "Erin Kral", initials: "EK", avatarColor: "hsl(0 0% 50%)" };

function row(
  id: string,
  groupId: string,
  requestedDay: string,
  extra: Partial<VacationListItem> = {}
): VacationListItem {
  return {
    id,
    userId: erin.id,
    groupId,
    requestId: `r-${id}`,
    requestedDay,
    startTime: null,
    endTime: null,
    vacationType: CalendarRecordType.Vacation,
    halfDay: false,
    note: null,
    rejectionReason: null,
    approvedAt: "2026-10-01T09:00:00.000Z",
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    deletedAt: null,
    deletedByUserId: null,
    createdByUserId: null,
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-01T09:00:00.000Z",
    user: erin,
    canApprove: false,
    ...extra,
  };
}

let vacationsResult: { data: VacationListItem[] | undefined; isLoading: boolean; error: unknown };

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/requests/",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "u-owner" } } }),
}));

vi.mock("@/lib/api/queries", () => ({
  useGroups: () => ({
    data: [{ id: TEAM, groupName: "Dev Team" }],
    isLoading: false,
    error: null,
  }),
  useVacations: () => vacationsResult,
  useReportScope: () => ({
    data: {
      groups: [
        { groupId: SUPPORT, groupName: "Dev Support", access: "all", canEditQuotas: true },
        { groupId: TEAM, groupName: "Dev Team", access: "all", canEditQuotas: true },
      ],
    },
    isLoading: false,
    error: null,
  }),
  useApproveVacations: () => ({ mutate: vi.fn(), isPending: false }),
  useRejectVacations: () => ({ mutate: vi.fn(), isPending: false }),
  useCancelVacations: () => ({ mutate: vi.fn(), isPending: false }),
  useVacation: () => ({ data: undefined, isLoading: false, error: null }),
  useCommentVacation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe("RequestsPage on a group the caller administers without belonging to it", () => {
  beforeEach(() => {
    vacationsResult = { data: [], isLoading: false, error: null };
  });

  it("names the administered group on its rows instead of an id fragment", () => {
    vacationsResult = {
      data: [row("v-1", SUPPORT, "2026-10-14")],
      isLoading: false,
      error: null,
    };

    renderWithClient(<RequestsPage />);

    expect(screen.queryByText(SUPPORT.slice(0, 8))).not.toBeInTheDocument();
    expect(screen.getByRole("cell", { name: /Dev Support/ })).toBeInTheDocument();
  });

  it("names a mirrored row's source group, which the caller may belong to nowhere", () => {
    vacationsResult = {
      data: [
        row("v-2", MIRROR_SOURCE, "2026-10-15", {
          mirroredFromGroupId: MIRROR_SOURCE,
          mirroredFromGroupName: "Sales",
        }),
      ],
      isLoading: false,
      error: null,
    };

    renderWithClient(<RequestsPage />);

    expect(screen.queryByText(MIRROR_SOURCE.slice(0, 8))).not.toBeInTheDocument();
    expect(screen.getByRole("cell", { name: /Sales/ })).toBeInTheDocument();
  });

  it("never shows the backend's raw message when the list is refused", () => {
    vacationsResult = {
      data: undefined,
      isLoading: false,
      error: new ApiError(403, "No access to view this group's records"),
    };

    renderWithClient(<RequestsPage />);

    expect(screen.queryByText("No access to view this group's records")).not.toBeInTheDocument();
    expect(screen.getByText("You don't have access to this group's requests.")).toBeInTheDocument();
  });

  it("shows its own copy rather than the backend's message on any other failure", () => {
    vacationsResult = {
      data: undefined,
      isLoading: false,
      error: new ApiError(500, "Internal Server Error"),
    };

    renderWithClient(<RequestsPage />);

    expect(screen.queryByText("Internal Server Error")).not.toBeInTheDocument();
    expect(
      screen.getByText("Could not load the requests. Try again in a moment.")
    ).toBeInTheDocument();
  });
});
