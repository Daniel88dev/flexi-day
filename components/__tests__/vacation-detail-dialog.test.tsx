import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VacationDetailDialog } from "../vacation-detail-dialog";
import { renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import { VacationKind, type VacationDetail } from "@/lib/api/types";

const detail: VacationDetail = {
  id: "v-1",
  userId: "u-1",
  groupId: "g-1",
  groupName: "Platform",
  requestedDay: "2026-08-12",
  rangeStart: "2026-08-12",
  rangeEnd: "2026-08-12",
  vacationIds: ["v-1"],
  startTime: null,
  endTime: null,
  vacationType: VacationKind.Vacation,
  halfDay: false,
  note: "Family trip",
  rejectionReason: null,
  approvedAt: "2026-08-01T09:00:00.000Z",
  approvedBy: "u-2",
  rejectedAt: null,
  rejectedBy: null,
  deletedAt: null,
  deletedByUserId: null,
  createdByUserId: null,
  createdAt: "2026-07-20T09:00:00.000Z",
  updatedAt: "2026-08-01T09:00:00.000Z",
  user: { id: "u-1", name: "Dana Holt", initials: "DH", avatarColor: "hsl(270 60% 60%)" },
  approvedByUser: {
    id: "u-2",
    name: "Ada Lovelace",
    initials: "AL",
    avatarColor: "hsl(10 60% 60%)",
  },
  rejectedByUser: null,
  createdByUser: null,
  deletedByUser: null,
  canApprove: false,
  canCancel: true,
  canEdit: false,
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
const rejectMutate = vi.fn().mockResolvedValue({ message: "ok" });
const commentMutate = vi.fn().mockResolvedValue({ message: "ok" });
let currentDetail: VacationDetail = detail;

vi.mock("@/lib/api/queries", () => ({
  useVacation: () => ({ data: currentDetail, isLoading: false, error: null }),
  useApproveVacations: () => ({ mutateAsync: approveMutate, isPending: false }),
  useRejectVacations: () => ({ mutateAsync: rejectMutate, isPending: false }),
  useCancelVacations: () => ({ mutateAsync: cancelMutate, isPending: false }),
  useCommentVacation: () => ({ mutateAsync: commentMutate, isPending: false }),
  useUpdateVacation: () => ({ mutateAsync: vi.fn().mockResolvedValue([]), isPending: false }),
}));

describe("VacationDetailDialog", () => {
  beforeEach(() => {
    currentDetail = detail;
    cancelMutate.mockClear();
    approveMutate.mockClear();
    rejectMutate.mockClear();
    commentMutate.mockClear();
  });

  it("renders the request, its status and its history", () => {
    renderWithClient(<VacationDetailDialog vacationId="v-1" open onOpenChange={() => {}} />);

    expect(screen.getByText("Request details")).toBeInTheDocument();
    expect(screen.getByText("Dana Holt")).toBeInTheDocument();
    expect(screen.getByText("Family trip")).toBeInTheDocument();
    expect(screen.getByText("Requested")).toBeInTheDocument();
    // The status badge and the "Approved" history event both read "Approved".
    expect(screen.getAllByText("Approved").length).toBeGreaterThanOrEqual(2);
  });

  it("cancels with the typed reason", async () => {
    const user = userEvent.setup();
    renderWithClient(<VacationDetailDialog vacationId="v-1" open onOpenChange={() => {}} />);

    await user.type(screen.getByLabelText("Comment or reason"), "Plans changed");
    await user.click(screen.getByRole("button", { name: /Cancel request/i }));

    expect(cancelMutate).toHaveBeenCalledWith({ ids: ["v-1"], reason: "Plans changed" });
  });

  it("translates the conflict when someone else cancelled the request first", async () => {
    cancelMutate.mockRejectedValueOnce(
      new ApiError(409, "One or more of these requests has already been cancelled")
    );
    const user = userEvent.setup();
    renderWithClient(<VacationDetailDialog vacationId="v-1" open onOpenChange={() => {}} />);

    await user.click(screen.getByRole("button", { name: /Cancel request/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This request was already cancelled, so nothing changed."
    );
  });

  it("keeps the backend's message for a failure it has no translation for", async () => {
    cancelMutate.mockRejectedValueOnce(new ApiError(403, "You cannot cancel this request"));
    const user = userEvent.setup();
    renderWithClient(<VacationDetailDialog vacationId="v-1" open onOpenChange={() => {}} />);

    await user.click(screen.getByRole("button", { name: /Cancel request/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("You cannot cancel this request");
  });

  it("shows the full span for a multi-day request", () => {
    currentDetail = {
      ...detail,
      rangeStart: "2026-08-10",
      rangeEnd: "2026-08-11",
      vacationIds: ["v-1", "v-2"],
    };
    renderWithClient(<VacationDetailDialog vacationId="v-1" open onOpenChange={() => {}} />);

    // The header description spans both days rather than a single date.
    expect(screen.getByText(/10 Aug 2026 –.*11 Aug 2026/)).toBeInTheDocument();
  });

  it("approves every day of the range in one call", async () => {
    currentDetail = { ...detail, canApprove: true, vacationIds: ["v-1", "v-2"] };
    const user = userEvent.setup();
    renderWithClient(<VacationDetailDialog vacationId="v-1" open onOpenChange={() => {}} />);

    await user.click(screen.getByRole("button", { name: /^Approve$/i }));

    expect(approveMutate).toHaveBeenCalledWith(["v-1", "v-2"]);
  });

  it("posts a comment with the typed message and can comment without approval rights", async () => {
    const user = userEvent.setup();
    // detail has canApprove: false, canCancel: true — commenting must still work.
    renderWithClient(<VacationDetailDialog vacationId="v-1" open onOpenChange={() => {}} />);

    const commentButton = screen.getByRole("button", { name: /^Comment$/i });
    expect(commentButton).toBeDisabled(); // empty comment is not allowed

    await user.type(screen.getByLabelText("Comment or reason"), "Any update on this?");
    await user.click(screen.getByRole("button", { name: /^Comment$/i }));

    expect(commentMutate).toHaveBeenCalledWith({ id: "v-1", message: "Any update on this?" });
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

    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("attributes a record created by an admin on the member's behalf", () => {
    currentDetail = {
      ...detail,
      createdByUser: { id: "u-2", name: "Ada Lovelace", initials: "AL", avatarColor: "x" },
    };
    renderWithClient(<VacationDetailDialog vacationId="v-1" open onOpenChange={() => {}} />);

    expect(screen.getByText("Created by Ada Lovelace on the member's behalf")).toBeInTheDocument();
  });

  it("does not show a created-by line for a self-created record", () => {
    currentDetail = {
      ...detail,
      createdByUser: { id: "u-1", name: "Dana Holt", initials: "DH", avatarColor: "x" },
    };
    renderWithClient(<VacationDetailDialog vacationId="v-1" open onOpenChange={() => {}} />);

    expect(screen.queryByText(/Created by/)).not.toBeInTheDocument();
  });

  it("names who cancelled a cancelled record", () => {
    currentDetail = {
      ...detail,
      deletedAt: "2026-08-02T09:00:00.000Z",
      deletedByUser: { id: "u-2", name: "Ada Lovelace", initials: "AL", avatarColor: "x" },
    };
    renderWithClient(<VacationDetailDialog vacationId="v-1" open onOpenChange={() => {}} />);

    expect(screen.getByText("Cancelled by Ada Lovelace")).toBeInTheDocument();
  });

  it("offers Edit only when the backend allows it", () => {
    renderWithClient(<VacationDetailDialog vacationId="v-1" open onOpenChange={() => {}} />);
    expect(screen.queryByRole("button", { name: /^Edit$/i })).not.toBeInTheDocument();
  });

  it("shows the Edit button for admins", () => {
    currentDetail = { ...detail, canEdit: true };
    renderWithClient(<VacationDetailDialog vacationId="v-1" open onOpenChange={() => {}} />);

    expect(screen.getByRole("button", { name: /^Edit$/i })).toBeInTheDocument();
  });

  it("renders UPDATED history events with their change summary", () => {
    currentDetail = {
      ...detail,
      history: [
        ...detail.history,
        {
          id: "e-3",
          vacationId: "v-1",
          eventType: "UPDATED",
          actor: { id: "u-2", name: "Ada Lovelace", initials: "AL", avatarColor: "x" },
          reason: "Type: Vacation → Sick",
          createdAt: "2026-08-03T09:00:00.000Z",
        },
      ],
    };
    renderWithClient(<VacationDetailDialog vacationId="v-1" open onOpenChange={() => {}} />);

    expect(screen.getByText("Updated")).toBeInTheDocument();
    expect(screen.getByText(/Type: Vacation → Sick/)).toBeInTheDocument();
  });
});
