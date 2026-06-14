import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApprovalsWidget } from "../approvals-widget";
import { renderWithClient } from "@/lib/test-utils";
import { VacationKind, type PendingApproval } from "@/lib/api/types";

const sample: PendingApproval[] = [
  {
    vacationId: "v-1",
    user: { id: "u-1", name: "Dana Holt", initials: "DH", avatarColor: "hsl(270 60% 60%)" },
    groupId: "g-1",
    groupName: "Product",
    vacationType: VacationKind.Vacation,
    from: "2026-06-22",
    to: "2026-06-23",
    businessDays: 2,
    note: null,
    submittedAt: "2026-06-10T10:00:00.000Z",
  },
];

const approveMutate = vi.fn();
const rejectMutate = vi.fn();

vi.mock("@/lib/api/queries", () => ({
  useMyApprovals: () => ({ data: sample, isLoading: false, error: null }),
  useApproveVacation: () => ({ mutate: approveMutate, isPending: false }),
  useRejectVacation: () => ({ mutate: rejectMutate, isPending: false }),
}));

describe("ApprovalsWidget", () => {
  beforeEach(() => {
    approveMutate.mockClear();
    rejectMutate.mockClear();
  });

  it("renders pending approval rows", () => {
    renderWithClient(<ApprovalsWidget />);
    expect(screen.getByText("Pending approvals")).toBeInTheDocument();
    expect(screen.getByText("Dana Holt")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Approve/i })).toBeInTheDocument();
  });

  it("calls approve.mutate with the vacationId when Approve is clicked", async () => {
    const user = userEvent.setup();
    renderWithClient(<ApprovalsWidget />);
    await user.click(screen.getByRole("button", { name: /Approve/i }));
    expect(approveMutate).toHaveBeenCalledWith("v-1");
  });

  it("calls reject.mutate with the vacationId when Decline is clicked", async () => {
    const user = userEvent.setup();
    renderWithClient(<ApprovalsWidget />);
    await user.click(screen.getByRole("button", { name: /Decline/i }));
    expect(rejectMutate).toHaveBeenCalledWith({ id: "v-1" });
  });
});
