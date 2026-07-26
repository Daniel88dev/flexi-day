import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RequestsPage from "../page";
import { renderWithClient } from "@/lib/test-utils";
import { VacationKind, type VacationListItem } from "@/lib/api/types";

const approveMutate = vi.fn();
const rejectMutate = vi.fn();
const cancelMutate = vi.fn();

const employee = { id: "u-emp", name: "Dana Holt", initials: "DH", avatarColor: "hsl(0 0% 50%)" };

function day(id: string, requestedDay: string): VacationListItem {
  return {
    id,
    userId: "u-emp",
    groupId: "g-1",
    requestedDay,
    startTime: null,
    endTime: null,
    vacationType: VacationKind.Vacation,
    halfDay: false,
    note: null,
    rejectionReason: null,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    deletedAt: null,
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
    user: employee,
  };
}

// A single 3-day pending request, stored as three per-day rows.
const vacations = [day("v-1", "2026-08-17"), day("v-2", "2026-08-18"), day("v-3", "2026-08-19")];

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/auth-client", () => ({
  // The approver: mainApprovalUser on the group below.
  useSession: () => ({ data: { user: { id: "approver-1" } } }),
}));

vi.mock("@/lib/api/queries", () => ({
  useGroups: () => ({
    data: [{ id: "g-1", groupName: "Platform", mainApprovalUser: "approver-1" }],
    isLoading: false,
    error: null,
  }),
  useVacations: () => ({ data: vacations, isLoading: false, error: null }),
  useApproveVacations: () => ({ mutate: approveMutate, isPending: false }),
  useRejectVacations: () => ({ mutate: rejectMutate, isPending: false }),
  useCancelVacations: () => ({ mutate: cancelMutate, isPending: false }),
  // Rendered (closed) dialog pulls these from the same module.
  useVacation: () => ({ data: undefined, isLoading: false, error: null }),
  useCommentVacation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe("RequestsPage grouping", () => {
  beforeEach(() => {
    approveMutate.mockClear();
    rejectMutate.mockClear();
    cancelMutate.mockClear();
  });

  it("shows one row with the full range for a multi-day request", () => {
    renderWithClient(<RequestsPage />);

    // One collapsed row, not three per-day rows.
    expect(screen.getAllByRole("button", { name: "Approve" })).toHaveLength(1);
    expect(screen.getByText(/17 Aug 2026 –.*19 Aug 2026/)).toBeInTheDocument();
    expect(screen.getByText("(3 days)")).toBeInTheDocument();
  });

  it("approves the whole range in one call", async () => {
    const user = userEvent.setup();
    renderWithClient(<RequestsPage />);

    await user.click(screen.getByRole("button", { name: "Approve" }));

    expect(approveMutate).toHaveBeenCalledWith(["v-1", "v-2", "v-3"]);
  });

  it("rejects the whole range in one call", async () => {
    const user = userEvent.setup();
    renderWithClient(<RequestsPage />);

    await user.click(screen.getByRole("button", { name: "Reject" }));

    expect(rejectMutate).toHaveBeenCalledWith({ ids: ["v-1", "v-2", "v-3"] });
  });
});
