import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { NewRequestDialog } from "../new-request-dialog";
import { renderWithClient } from "@/lib/test-utils";
import { UploadError } from "@/lib/api/attachment-upload";
import { CalendarRecordType, type Attachment, type VacationDetail } from "@/lib/api/types";

const createMutate = vi.fn();
const uploadMutate = vi.fn();
let uploadsAvailable: boolean | undefined;
let vacationDetail: VacationDetail | undefined;
let canAdmin = false;
let sickDayActive = false;
// Per-group override so a test can present groups with different benefits.
let sickDayActiveByGroup: Record<string, boolean> = {};
let groups: { id: string; groupName: string }[] = [{ id: "g-1", groupName: "Platform" }];
let members: unknown[] = [];

vi.mock("@/lib/api/queries", () => ({
  useGroups: () => ({ data: groups, isLoading: false }),
  useCreateVacation: () => ({ mutateAsync: createMutate, isPending: false }),
  useGroup: (id: string | null) => ({
    data: id
      ? {
          id,
          groupName: groups.find((g) => g.id === id)?.groupName ?? id,
          organization: { sickDayBenefitActive: sickDayActiveByGroup[id] ?? sickDayActive },
          uploadsAvailable,
          access: { canView: true, canAdmin, viaOrgAdmin: false, isMember: true },
        }
      : undefined,
    isLoading: false,
    error: null,
  }),
  useGroupUsers: () => ({ data: members, isLoading: false, error: null }),
  useVacation: (id: string | null) => ({
    data: id ? vacationDetail : undefined,
    isLoading: false,
    error: null,
  }),
  useUploadAttachment: () => ({ mutateAsync: uploadMutate, isPending: false }),
  useDeleteAttachment: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "u-self" } } }),
}));

const member = {
  userId: "u-member",
  controlledUser: true,
  deletedAt: null,
  user: { id: "u-member", name: "Dana Holt", initials: "DH", avatarColor: "hsl(270 60% 60%)" },
};

const self = { id: "u-self", name: "Sam Reed", initials: "SR", avatarColor: "hsl(0 0% 50%)" };

const created: VacationDetail = {
  id: "v-1",
  userId: "u-self",
  groupId: "g-1",
  groupName: "Platform",
  requestedDay: "2026-07-15",
  rangeStart: "2026-07-15",
  rangeEnd: "2026-07-15",
  vacationIds: ["v-1"],
  requestId: "r-1",
  startTime: null,
  endTime: null,
  vacationType: CalendarRecordType.Sick,
  halfDay: false,
  note: null,
  rejectionReason: null,
  approvedAt: null,
  approvedBy: null,
  rejectedAt: null,
  rejectedBy: null,
  deletedAt: null,
  deletedByUserId: null,
  createdByUserId: null,
  createdAt: "2026-07-14T09:00:00.000Z",
  updatedAt: "2026-07-14T09:00:00.000Z",
  user: self,
  approvedByUser: null,
  rejectedByUser: null,
  createdByUser: null,
  deletedByUser: null,
  canApprove: false,
  canCancel: true,
  canEdit: false,
  history: [],
  attachments: [],
  canAttach: true,
};

const uploadedRow: Attachment = {
  id: "a-1",
  requestId: "r-1",
  fileName: "note.png",
  contentType: "image/png",
  size: 4,
  status: "READY",
  rejectionReason: null,
  uploadedByUserId: "u-self",
  // Fresh, or the ten-minute rule would read the row as a failed upload.
  createdAt: new Date().toISOString(),
  deletedAt: null,
  deletedByUserId: null,
};

const png = () => new File(["x".repeat(4)], "note.png", { type: "image/png" });

describe("NewRequestDialog", () => {
  beforeEach(() => {
    createMutate.mockReset();
    createMutate.mockResolvedValue([{ id: "v-1", requestId: "r-1" }]);
    uploadMutate.mockReset();
    uploadsAvailable = undefined;
    vacationDetail = undefined;
    canAdmin = false;
    sickDayActive = false;
    sickDayActiveByGroup = {};
    groups = [{ id: "g-1", groupName: "Platform" }];
    members = [];
  });

  it("offers Sick day under Others only for a group whose benefit is active", async () => {
    sickDayActive = true;
    const user = userEvent.setup();
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    await user.click(screen.getByRole("tab", { name: "Others" }));
    await user.click(screen.getByRole("combobox", { name: "Others" }));
    expect(screen.getByRole("option", { name: "Sick day" })).toBeInTheDocument();
  });

  it("seeds From and To with initialDate when opened with a preset day", () => {
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    expect(screen.getByLabelText("From")).toHaveValue("2026-07-15");
    expect(screen.getByLabelText("To")).toHaveValue("2026-07-15");
  });

  it("hides the built-in trigger button when controlled", () => {
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    // The dialog title is "New Request" (not a button); the "+ New Request"
    // trigger button must be absent in controlled mode.
    expect(screen.queryByRole("button", { name: "+ New Request" })).toBeNull();
  });

  it("offers the three everyday types plus Others at the top level", () => {
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    for (const name of ["Vacation", "Home Office", "Sick", "Others"]) {
      expect(screen.getByRole("tab", { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole("tab", { name: "Paid Time Off" })).toBeNull();
  });

  it("reveals the rarer types with their dashboard colors behind Others", async () => {
    const user = userEvent.setup();
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    await user.click(screen.getByRole("tab", { name: "Others" }));
    await user.click(screen.getByRole("combobox", { name: "Others" }));

    // The full Others set, in order — and neither Sick day (not offered until
    // the benefit ships) nor Bank Holiday (never requestable).
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Paid Time Off",
      "Non-Paid Leave",
      "Study Leave",
      "Other",
    ]);

    const dot = screen
      .getByRole("option", { name: "Paid Time Off" })
      .querySelector("[aria-hidden]");
    expect(dot?.getAttribute("style")).toContain("--c-pto");
  });

  it("submits the type picked in the Others select", async () => {
    const user = userEvent.setup();
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    await user.click(screen.getByRole("tab", { name: "Others" }));
    // Others open with nothing picked yet — there is no type to submit.
    expect(screen.getByRole("button", { name: "Submit Request" })).toBeDisabled();

    await user.click(screen.getByRole("combobox", { name: "Others" }));
    await user.click(screen.getByRole("option", { name: "Study Leave" }));
    await user.click(screen.getByRole("button", { name: "Submit Request" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalled());
    expect(createMutate.mock.calls[0][0]).toMatchObject({ vacationType: "STUDY_LEAVE" });
  });

  it("resets a Sick day selection when the selected group loses the benefit", async () => {
    sickDayActive = true;
    const user = userEvent.setup();
    const { rerender, client } = renderWithClient(
      <NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />
    );

    await user.click(screen.getByRole("tab", { name: "Others" }));
    await user.click(screen.getByRole("combobox", { name: "Others" }));
    await user.click(screen.getByRole("option", { name: "Sick day" }));

    // The user switches to a group without the benefit; the mocked useGroup
    // answers for whichever group is selected, so flipping the flag stands in
    // for the new group's badge arriving.
    sickDayActive = false;
    rerender(
      <QueryClientProvider client={client}>
        <NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Vacation" })).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });
    expect(screen.getByRole("button", { name: "Submit Request" })).toBeEnabled();
  });

  it("clears a Sick day pick on group switch and submits the type it shows", async () => {
    groups = [
      { id: "g-1", groupName: "Platform" },
      { id: "g-2", groupName: "Retail" },
    ];
    sickDayActiveByGroup = { "g-1": true, "g-2": false };
    const user = userEvent.setup();
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    await user.click(screen.getByRole("tab", { name: "Others" }));
    await user.click(screen.getByRole("combobox", { name: "Others" }));
    await user.click(screen.getByRole("option", { name: "Sick day" }));

    await user.click(screen.getByRole("combobox", { name: "Group" }));
    await user.click(screen.getByRole("option", { name: "Retail" }));

    expect(screen.getByRole("tab", { name: "Vacation" })).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("button", { name: "Submit Request" }));
    await waitFor(() => expect(createMutate).toHaveBeenCalled());
    expect(createMutate.mock.calls[0][0]).toMatchObject({
      groupId: "g-2",
      vacationType: "VACATION",
    });
  });

  it("blocks an Other request until a note is written", async () => {
    const user = userEvent.setup();
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    await user.click(screen.getByRole("tab", { name: "Others" }));
    await user.click(screen.getByRole("combobox", { name: "Others" }));
    await user.click(screen.getByRole("option", { name: "Other" }));

    expect(screen.getByRole("button", { name: "Submit Request" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Note (required for Other)"), {
      target: { value: "Jury duty" },
    });
    await user.click(screen.getByRole("button", { name: "Submit Request" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalled());
    expect(createMutate.mock.calls[0][0]).toMatchObject({
      vacationType: "OTHER",
      note: "Jury duty",
    });
  });

  it("submits halfDay when the toggle is on", async () => {
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    fireEvent.click(screen.getByRole("checkbox", { name: "Half day" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit Request" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalled());
    expect(createMutate.mock.calls[0][0]).toMatchObject({ halfDay: true });
  });

  it("submits halfDay false by default", async () => {
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "Submit Request" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalled());
    expect(createMutate.mock.calls[0][0]).toMatchObject({ halfDay: false });
  });

  it("hides the half-day toggle once the request spans more than one day", () => {
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    expect(screen.getByRole("checkbox", { name: "Half day" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-07-17" } });

    expect(screen.queryByRole("checkbox", { name: "Half day" })).toBeNull();
  });

  it("does not send a half day for a multi-day range", async () => {
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    fireEvent.click(screen.getByRole("checkbox", { name: "Half day" }));
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-07-17" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit Request" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalled());
    expect(createMutate.mock.calls[0][0]).toMatchObject({ halfDay: false });
  });

  it("hides the member picker for non-admins", () => {
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    expect(screen.queryByLabelText("For")).toBeNull();
  });

  it("submits without on-behalf fields when an admin books for themselves", async () => {
    canAdmin = true;
    members = [member];
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    expect(screen.getByLabelText("For")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Submit Request" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalled());
    const payload = createMutate.mock.calls[0][0];
    expect(payload.userId).toBeUndefined();
    expect(payload.autoApprove).toBeUndefined();
  });

  it("books on behalf with autoApprove pre-checked when a member is picked", async () => {
    canAdmin = true;
    members = [member];
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    fireEvent.click(screen.getByLabelText("For"));
    fireEvent.click(await screen.findByRole("option", { name: "Dana Holt" }));

    expect(screen.getByLabelText("Approve immediately")).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Submit Request" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalled());
    expect(createMutate.mock.calls[0][0]).toMatchObject({
      userId: "u-member",
      autoApprove: true,
    });
  });

  it("sends autoApprove false when the admin unchecks it", async () => {
    canAdmin = true;
    members = [member];
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    fireEvent.click(screen.getByLabelText("For"));
    fireEvent.click(await screen.findByRole("option", { name: "Dana Holt" }));
    fireEvent.click(screen.getByLabelText("Approve immediately"));
    fireEvent.click(screen.getByRole("button", { name: "Submit Request" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalled());
    expect(createMutate.mock.calls[0][0]).toMatchObject({
      userId: "u-member",
      autoApprove: false,
    });
  });

  it("offers the picker with its notice only when the group can take uploads", () => {
    uploadsAvailable = false;
    const view = renderWithClient(
      <NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />
    );
    expect(screen.queryByLabelText("Add files")).toBeNull();

    uploadsAvailable = true;
    view.rerender(
      <QueryClientProvider client={view.client}>
        <NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />
      </QueryClientProvider>
    );
    expect(screen.getByLabelText("Add files")).toBeEnabled();
    expect(
      screen.getByText("Approvers and managers of the group can see attached files.")
    ).toBeInTheDocument();
  });

  it("closes at once when no file was picked", async () => {
    uploadsAvailable = true;
    const onOpenChange = vi.fn();
    renderWithClient(
      <NewRequestDialog open initialDate="2026-07-15" onOpenChange={onOpenChange} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit Request" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(uploadMutate).not.toHaveBeenCalled();
  });

  it("creates the request, then uploads the picked file and closes once it is accepted", async () => {
    uploadsAvailable = true;
    const onOpenChange = vi.fn();
    let progress: ((fraction: number) => void) | undefined;
    let finish: (value: Attachment) => void = () => {};
    uploadMutate.mockImplementation((input: { onProgress?: (f: number) => void }) => {
      progress = input.onProgress;
      return new Promise<Attachment>((resolve) => {
        finish = resolve;
      });
    });
    const user = userEvent.setup();
    const view = renderWithClient(
      <NewRequestDialog open initialDate="2026-07-15" onOpenChange={onOpenChange} />
    );

    await user.upload(screen.getByLabelText("Add files"), png());
    expect(screen.getByText("note.png")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove note.png" })).toBeInTheDocument();
    expect(uploadMutate).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Submit Request" }));

    await waitFor(() => expect(uploadMutate).toHaveBeenCalledTimes(1));
    expect(createMutate).toHaveBeenCalledTimes(1);
    expect(createMutate.mock.invocationCallOrder[0]).toBeLessThan(
      uploadMutate.mock.invocationCallOrder[0]
    );
    expect(uploadMutate.mock.calls[0][0]).toMatchObject({ requestId: "r-1" });
    expect(screen.getByText("Request sent")).toBeInTheDocument();
    expect(screen.queryByLabelText("From")).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();

    progress?.(0.5);
    expect(await screen.findByText("Uploading… 50%")).toBeInTheDocument();

    vacationDetail = { ...created, attachments: [{ ...uploadedRow, status: "UPLOADING" }] };
    finish({ ...uploadedRow, status: "UPLOADING" });
    expect(await screen.findByText("Checking the file…")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();

    // The next poll reports the file accepted.
    vacationDetail = { ...created, attachments: [uploadedRow] };
    view.rerender(
      <QueryClientProvider client={view.client}>
        <NewRequestDialog open initialDate="2026-07-15" onOpenChange={onOpenChange} />
      </QueryClientProvider>
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("stays open with the reason when a file is rejected, until dismissed", async () => {
    uploadsAvailable = true;
    const onOpenChange = vi.fn();
    uploadMutate.mockImplementation(async () => {
      vacationDetail = {
        ...created,
        attachments: [{ ...uploadedRow, status: "REJECTED", rejectionReason: "IMAGE_UNREADABLE" }],
      };
      return { ...uploadedRow, status: "UPLOADING" };
    });
    const user = userEvent.setup();
    renderWithClient(
      <NewRequestDialog open initialDate="2026-07-15" onOpenChange={onOpenChange} />
    );

    await user.upload(screen.getByLabelText("Add files"), png());
    await user.click(screen.getByRole("button", { name: "Submit Request" }));

    expect(await screen.findByText("Rejected: the image couldn't be read.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Some files were not accepted. Replace them here, or later from the request's details."
      )
    ).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("settles as failed, not still checking, when a registered file's bytes never arrive", async () => {
    uploadsAvailable = true;
    const onOpenChange = vi.fn();
    uploadMutate.mockImplementation(async () => {
      vacationDetail = { ...created, attachments: [{ ...uploadedRow, status: "UPLOADING" }] };
      throw new UploadError(0, "Upload failed", "a-1");
    });
    const user = userEvent.setup();
    renderWithClient(
      <NewRequestDialog open initialDate="2026-07-15" onOpenChange={onOpenChange} />
    );

    await user.upload(screen.getByLabelText("Add files"), png());
    await user.click(screen.getByRole("button", { name: "Submit Request" }));

    expect(await screen.findByText("Upload failed. The file did not arrive.")).toBeInTheDocument();
    expect(screen.queryByText("Checking the file…")).toBeNull();
    expect(
      screen.getByText(
        "Some files were not accepted. Replace them here, or later from the request's details."
      )
    ).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("drops the picked files when the group changes", async () => {
    uploadsAvailable = true;
    groups = [
      { id: "g-1", groupName: "Platform" },
      { id: "g-2", groupName: "Ops" },
    ];
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    renderWithClient(
      <NewRequestDialog open initialDate="2026-07-15" onOpenChange={onOpenChange} />
    );

    await user.upload(screen.getByLabelText("Add files"), png());
    expect(screen.getByText("note.png")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Group"));
    fireEvent.click(await screen.findByRole("option", { name: "Ops" }));
    expect(screen.queryByText("note.png")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Submit Request" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(uploadMutate).not.toHaveBeenCalled();
  });
});
