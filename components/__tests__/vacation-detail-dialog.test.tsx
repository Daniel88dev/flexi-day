import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VacationDetailDialog } from "../vacation-detail-dialog";
import { renderWithClient } from "@/lib/test-utils";
import { VacationKind, type VacationDetail } from "@/lib/api/types";

const detail: VacationDetail = {
  id: "v-1",
  userId: "u-1",
  groupId: "g-1",
  groupName: "Platform",
  requestedDay: "2026-08-12",
  startTime: null,
  endTime: null,
  vacationType: VacationKind.Vacation,
  note: "Family trip",
  rejectionReason: null,
  approvedAt: "2026-08-01T09:00:00.000Z",
  approvedBy: "u-2",
  rejectedAt: null,
  rejectedBy: null,
  deletedAt: null,
  createdAt: "2026-07-20T09:00:00.000Z",
  updatedAt: "2026-08-01T09:00:00.000Z",
  user: { id: "u-1", name: "Dana Holt", initials: "DH", avatarColor: "hsl(270 60% 60%)" },
  approvedByUser: { id: "u-2", name: "Ada Lovelace", initials: "AL", avatarColor: "hsl(10 60% 60%)" },
  rejectedByUser: null,
  canApprove: false,
  canCancel: true,
  history: [
    {
      id: "e-1",
      vacationId: "v-1",
      eventType: "CREATED",
      actor: { id: "u-1", name: "Dana Holt", initials: "DH", avatarColor: "hsl(270 60% 60%)" },
      reason: null,
      createdAt: "2026-07-20T09:00:00.000Z",
    },
    {
      id: "e-2",
      vacationId: "v-1",
      eventType: "APPROVED",
      actor: { id: "u-2", name: "Ada Lovelace", initials: "AL", avatarColor: "hsl(10 60% 60%)" },
      reason: null,
      createdAt: "2026-08-01T09:00:00.000Z",
    },
  ],
};

const cancelMutate = vi.fn().mockResolvedValue({ message: "ok" });
const approveMutate = vi.fn().mockResolvedValue({ message: "ok" });
let currentDetail: VacationDetail = detail;

vi.mock("@/lib/api/queries", () => ({
  useVacation: () => ({ data: currentDetail, isLoading: false, error: null }),
  useApproveVacation: () => ({ mutateAsync: approveMutate, isPending: false }),
  useRejectVacation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCancelVacation: () => ({ mutateAsync: cancelMutate, isPending: false }),
}));

describe("VacationDetailDialog", () => {
  beforeEach(() => {
    currentDetail = detail;
    cancelMutate.mockClear();
    approveMutate.mockClear();
  });

  it("renders the request, its status and its history", () => {
    renderWithClient(<VacationDetailDialog vacationId="v-1" open onOpenChange={() => {}} />);

    expect(screen.getByText("Request details")).toBeInTheDocument();
    expect(screen.getByText("Dana Holt")).toBeInTheDocument();
    expect(screen.getByText("Family trip")).toBeInTheDocument();
    expect(screen.getByText("approved")).toBeInTheDocument();
    expect(screen.getByText("Requested")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("cancels with the typed reason", async () => {
    const user = userEvent.setup();
    renderWithClient(<VacationDetailDialog vacationId="v-1" open onOpenChange={() => {}} />);

    await user.type(screen.getByLabelText("Reason"), "Plans changed");
    await user.click(screen.getByRole("button", { name: /Cancel request/i }));

    expect(cancelMutate).toHaveBeenCalledWith({ id: "v-1", reason: "Plans changed" });
  });

  it("hides the decision buttons when the backend says the user cannot approve", () => {
    renderWithClient(<VacationDetailDialog vacationId="v-1" open onOpenChange={() => {}} />);

    expect(screen.queryByRole("button", { name: /^Approve$/i })).not.toBeInTheDocument();
  });

  it("shows approve and decline when the backend allows a decision", () => {
    currentDetail = { ...detail, canApprove: true };
    renderWithClient(<VacationDetailDialog vacationId="v-1" open onOpenChange={() => {}} />);

    expect(screen.getByRole("button", { name: /^Approve$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Decline/i })).toBeInTheDocument();
  });

  it("labels a cancelled request as cancelled even though it was approved", () => {
    currentDetail = { ...detail, deletedAt: "2026-08-02T09:00:00.000Z" };
    renderWithClient(<VacationDetailDialog vacationId="v-1" open onOpenChange={() => {}} />);

    expect(screen.getByText("cancelled")).toBeInTheDocument();
  });
});
