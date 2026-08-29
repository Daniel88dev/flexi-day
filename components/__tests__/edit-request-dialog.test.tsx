import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditRequestDialog } from "../edit-request-dialog";
import { renderWithClient } from "@/lib/test-utils";
import { CalendarRecordType, type VacationDetail } from "@/lib/api/types";

const updateMutate = vi.fn().mockResolvedValue([]);

vi.mock("@/lib/api/queries", () => ({
  useUpdateVacation: () => ({ mutateAsync: updateMutate, isPending: false }),
}));

const detail: VacationDetail = {
  id: "v-1",
  userId: "u-1",
  groupId: "g-1",
  groupName: "Platform",
  requestedDay: "2026-08-12",
  rangeStart: "2026-08-12",
  rangeEnd: "2026-08-12",
  vacationIds: ["v-1"],
  startTime: "09:00:00",
  endTime: "17:00:00",
  vacationType: CalendarRecordType.Vacation,
  halfDay: false,
  note: null,
  rejectionReason: null,
  approvedAt: null,
  approvedBy: null,
  rejectedAt: null,
  rejectedBy: null,
  deletedAt: null,
  deletedByUserId: null,
  createdByUserId: "u-2",
  createdAt: "2026-07-20T09:00:00.000Z",
  updatedAt: "2026-07-20T09:00:00.000Z",
  user: { id: "u-1", name: "Dana Holt", initials: "DH", avatarColor: "x" },
  approvedByUser: null,
  rejectedByUser: null,
  createdByUser: { id: "u-2", name: "Ada Lovelace", initials: "AL", avatarColor: "x" },
  deletedByUser: null,
  canApprove: false,
  canCancel: true,
  canEdit: true,
  history: [],
};

describe("EditRequestDialog", () => {
  beforeEach(() => {
    updateMutate.mockClear();
  });

  it("renders prefilled per-day fields", () => {
    renderWithClient(<EditRequestDialog detail={detail} open onOpenChange={() => {}} />);

    expect(screen.getByText("Edit request")).toBeInTheDocument();
    expect(screen.getByLabelText("Start time (optional)")).toHaveValue("09:00");
    expect(screen.getByLabelText("End time (optional)")).toHaveValue("17:00");
  });

  it("submits only the fields that changed, sending times as a pair", async () => {
    renderWithClient(
      <EditRequestDialog
        detail={{ ...detail, vacationIds: ["v-1", "v-2"], rangeEnd: "2026-08-13" }}
        open
        onOpenChange={() => {}}
      />
    );

    fireEvent.change(screen.getByLabelText("Start time (optional)"), {
      target: { value: "10:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalled());
    // Both times ride together so the backend validates the whole pair; the
    // untouched type and note stay out of the patch.
    expect(updateMutate.mock.calls[0][0]).toEqual({
      ids: ["v-1", "v-2"],
      startTime: "10:00",
      endTime: "17:00",
    });
  });

  it("opens a rarer kind under the Others group without rewriting it", async () => {
    const onOpenChange = vi.fn();
    renderWithClient(
      <EditRequestDialog
        detail={{ ...detail, vacationType: CalendarRecordType.StudyLeave }}
        open
        onOpenChange={onOpenChange}
      />
    );

    // Without an active tab, Radix's roving focus would land on "Vacation"
    // and silently rewrite the type on keyboard traversal.
    expect(screen.getByRole("tab", { name: "Others" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("combobox", { name: "Others" })).toHaveTextContent("Study Leave");

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it("still offers the record's own kind when it is not requestable at all", () => {
    renderWithClient(
      <EditRequestDialog
        detail={{ ...detail, vacationType: CalendarRecordType.SickDay }}
        open
        onOpenChange={() => {}}
      />
    );

    expect(screen.getByRole("tab", { name: "Others" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("combobox", { name: "Others" })).toHaveTextContent("Sick day");
  });

  it("requires a note before saving a switch to Other", async () => {
    const user = userEvent.setup();
    renderWithClient(<EditRequestDialog detail={detail} open onOpenChange={() => {}} />);

    await user.click(screen.getByRole("tab", { name: "Others" }));
    // Others open with nothing picked yet — saving would send no type at all.
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();

    await user.click(screen.getByRole("combobox", { name: "Others" }));
    await user.click(screen.getByRole("option", { name: "Other" }));
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Note (required for Other)"), {
      target: { value: "Jury duty" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalled());
    expect(updateMutate.mock.calls[0][0]).toEqual({
      ids: ["v-1"],
      vacationType: "OTHER",
      note: "Jury duty",
    });
  });

  it("closes without a request when nothing changed", async () => {
    const onOpenChange = vi.fn();
    renderWithClient(<EditRequestDialog detail={detail} open onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it("hides the half-day toggle for a multi-day run", () => {
    renderWithClient(
      <EditRequestDialog
        detail={{ ...detail, vacationIds: ["v-1", "v-2"], rangeEnd: "2026-08-13" }}
        open
        onOpenChange={() => {}}
      />
    );

    expect(screen.queryByRole("checkbox", { name: "Half day" })).toBeNull();
  });

  it("shows the backend error inline when the update fails", async () => {
    updateMutate.mockRejectedValueOnce(new Error("Rejected records cannot be edited"));
    renderWithClient(<EditRequestDialog detail={detail} open onOpenChange={() => {}} />);

    fireEvent.change(screen.getByLabelText("Start time (optional)"), {
      target: { value: "10:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Rejected records cannot be edited");
  });
});
