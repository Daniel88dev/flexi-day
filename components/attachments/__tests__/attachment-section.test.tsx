import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import { UploadError } from "@/lib/api/attachment-upload";
import { CalendarRecordType, type Attachment, type VacationDetail } from "@/lib/api/types";
import { AttachmentSection } from "../attachment-section";

const owner = { id: "u-1", name: "Dana Holt", initials: "DH", avatarColor: "hsl(270 60% 60%)" };
const admin = { id: "u-2", name: "Ada Lovelace", initials: "AL", avatarColor: "hsl(10 60% 60%)" };

const image: Attachment = {
  id: "a-img",
  requestId: "r-1",
  fileName: "doctors-note.jpg",
  contentType: "image/jpeg",
  size: 1.5 * 1024 * 1024,
  status: "READY",
  rejectionReason: null,
  uploadedByUserId: "u-1",
  createdAt: "2026-09-05T09:00:00.000Z",
  deletedAt: null,
  deletedByUserId: null,
};

const pdf: Attachment = {
  ...image,
  id: "a-pdf",
  fileName: "receipt.pdf",
  contentType: "application/pdf",
  size: 2048,
  uploadedByUserId: "u-2",
};

const detail: VacationDetail = {
  id: "v-1",
  userId: "u-1",
  groupId: "g-1",
  groupName: "Platform",
  requestedDay: "2026-08-12",
  rangeStart: "2026-08-12",
  rangeEnd: "2026-08-12",
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
  createdAt: "2026-07-20T09:00:00.000Z",
  updatedAt: "2026-08-01T09:00:00.000Z",
  user: owner,
  approvedByUser: null,
  rejectedByUser: null,
  createdByUser: null,
  deletedByUser: null,
  canApprove: false,
  canCancel: true,
  canEdit: false,
  history: [],
  attachments: [image, pdf],
  canAttach: true,
};

let sessionUserId = "u-1";
let uploadsAvailable: boolean | undefined = true;
const uploadMutate = vi.fn();
const downloadUrlMock = vi.fn();

vi.mock("@/lib/api/queries", () => ({
  useGroup: (id: string | null) => ({
    data: id ? { id, groupName: "Platform", uploadsAvailable } : undefined,
    isLoading: false,
    error: null,
  }),
  useUploadAttachment: () => ({ mutateAsync: uploadMutate, isPending: false }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: sessionUserId } } }),
}));

vi.mock("@/lib/api/attachments", () => ({
  getAttachmentDownloadUrl: (...args: unknown[]) => downloadUrlMock(...args),
}));

function render(overrides: Partial<VacationDetail> = {}) {
  return renderWithClient(<AttachmentSection detail={{ ...detail, ...overrides }} />);
}

const png = (name = "note.png", bytes = 4) =>
  new File(["x".repeat(bytes)], name, { type: "image/png" });

describe("AttachmentSection", () => {
  beforeEach(() => {
    sessionUserId = "u-1";
    uploadsAvailable = true;
    uploadMutate.mockReset();
    downloadUrlMock.mockReset();
    vi.useRealTimers();
  });

  it("renders nothing at all for a member who only has view access", () => {
    const { container } = render({ attachments: undefined, canAttach: undefined, canEdit: false });

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("Attachments")).not.toBeInTheDocument();
  });

  it("lists each file with its size and who uploaded it", () => {
    render();

    expect(screen.getByRole("heading", { name: "Attachments" })).toBeInTheDocument();
    expect(screen.getByText("doctors-note.jpg")).toBeInTheDocument();
    expect(screen.getByText(/^1\.5 MB · Uploaded by Dana Holt · .*2026/)).toBeInTheDocument();
    expect(screen.getByText(/^2 kB · Uploaded by an admin · .*2026/)).toBeInTheDocument();
  });

  it("names the admin when the detail already knows them", () => {
    render({ createdByUser: admin });

    expect(screen.getByText(/^2 kB · Uploaded by Ada Lovelace/)).toBeInTheDocument();
  });

  it("fetches an image's URL only on click and shows it in a preview dialog", async () => {
    downloadUrlMock.mockResolvedValue({ url: "https://files.test/img?sig=1" });
    const user = userEvent.setup();
    render();

    expect(downloadUrlMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Preview doctors-note.jpg" }));

    expect(downloadUrlMock).toHaveBeenCalledWith("a-img", "inline");
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("img", { name: "doctors-note.jpg" })).toHaveAttribute(
      "src",
      "https://files.test/img?sig=1"
    );
  });

  it("opens a PDF in a new tab once its URL arrives", async () => {
    const tab = { opener: {}, location: { href: "" } };
    const open = vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
    downloadUrlMock.mockResolvedValue({ url: "https://files.test/pdf?sig=1" });
    const user = userEvent.setup();
    render();

    await user.click(screen.getByRole("button", { name: "Open receipt.pdf" }));

    expect(open).toHaveBeenCalledWith("", "_blank");
    expect(downloadUrlMock).toHaveBeenCalledWith("a-pdf", "inline");
    await waitFor(() => expect(tab.location.href).toBe("https://files.test/pdf?sig=1"));
    expect(tab.opener).toBeNull();
    open.mockRestore();
  });

  it("reports a blocked popup instead of leaving the app for the PDF", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    downloadUrlMock.mockResolvedValue({ url: "https://files.test/pdf?sig=1" });
    const user = userEvent.setup();
    render();

    await user.click(screen.getByRole("button", { name: "Open receipt.pdf" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't open the file. Try again."
    );
    open.mockRestore();
  });

  it("downloads with the attachment disposition", async () => {
    downloadUrlMock.mockResolvedValue({ url: "https://files.test/pdf?dl=1" });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const user = userEvent.setup();
    render();

    await user.click(screen.getByRole("button", { name: "Download receipt.pdf" }));

    expect(downloadUrlMock).toHaveBeenCalledWith("a-pdf", "attachment");
    await waitFor(() => expect(click).toHaveBeenCalled());
    click.mockRestore();
  });

  it("explains when a URL could not be fetched", async () => {
    downloadUrlMock.mockRejectedValue(new ApiError(409, "Attachment is not ready for download"));
    const user = userEvent.setup();
    render();

    await user.click(screen.getByRole("button", { name: "Download receipt.pdf" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't open the file. Try again."
    );
  });

  it("shows a fresh upload as being checked, without a link", () => {
    vi.useFakeTimers({ now: new Date("2026-09-05T09:05:00.000Z") });
    render({ attachments: [{ ...image, status: "UPLOADING" }] });

    expect(screen.getByText("Checking the file…")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /doctors-note/ })).not.toBeInTheDocument();
  });

  it("shows an upload stuck for ten minutes as failed", () => {
    vi.useFakeTimers({ now: new Date("2026-09-05T09:10:01.000Z") });
    render({ attachments: [{ ...image, status: "UPLOADING" }] });

    expect(screen.getByText("Upload failed — the file never arrived.")).toBeInTheDocument();
  });

  it("spells out why a file was rejected", () => {
    render({
      attachments: [{ ...pdf, status: "REJECTED", rejectionReason: "PDF_JAVASCRIPT" }],
    });

    expect(screen.getByText("Rejected: the PDF contains scripts.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /receipt/ })).not.toBeInTheDocument();
  });

  it("offers the picker with the visibility notice when the owner may attach", () => {
    render();

    expect(screen.getByLabelText("Add files")).toBeEnabled();
    expect(
      screen.getByText("The group's approvers and managers will see this file.")
    ).toBeInTheDocument();
  });

  it("uploads a picked file, showing progress, then hands over to the server row", async () => {
    let progress: ((fraction: number) => void) | undefined;
    let finish: (value: Attachment) => void = () => {};
    uploadMutate.mockImplementation((input: { onProgress?: (f: number) => void }) => {
      progress = input.onProgress;
      return new Promise<Attachment>((resolve) => {
        finish = resolve;
      });
    });
    const user = userEvent.setup();
    const view = render({ attachments: [] });

    await user.upload(screen.getByLabelText("Add files"), png());

    expect(uploadMutate).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: "r-1", file: expect.any(File) })
    );
    expect(screen.getByRole("progressbar", { name: "note.png" })).toHaveAttribute(
      "aria-valuenow",
      "0"
    );

    progress?.(0.4);
    expect(await screen.findByText("Uploading… 40%")).toBeInTheDocument();

    finish({ ...image, id: "a-new", fileName: "note.png", status: "UPLOADING" });
    expect(await screen.findByText("Checking the file…")).toBeInTheDocument();

    // The refetched detail now carries the row; the local entry steps aside.
    view.rerender(
      <AttachmentSection
        detail={{
          ...detail,
          attachments: [{ ...image, id: "a-new", fileName: "note.png", status: "UPLOADING" }],
        }}
      />
    );
    expect(screen.getAllByText("note.png")).toHaveLength(1);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("refuses an unsupported type and an oversized file before any request", async () => {
    // The picker's accept list is advisory; a browser's "All files" option gets past it.
    const user = userEvent.setup({ applyAccept: false });
    render({ attachments: [] });

    await user.upload(screen.getByLabelText("Add files"), [
      new File(["x"], "notes.txt", { type: "text/plain" }),
      new File([new ArrayBuffer(10 * 1024 * 1024 + 1)], "huge.png", { type: "image/png" }),
    ]);

    expect(uploadMutate).not.toHaveBeenCalled();
    expect(
      screen.getByText("Only PNG, JPEG, WebP, HEIC and PDF files can be attached.")
    ).toBeInTheDocument();
    expect(screen.getByText("This file is over 10 MB.")).toBeInTheDocument();
  });

  it("translates the backend's refusal and lets the user dismiss it", async () => {
    uploadMutate.mockRejectedValue(
      new ApiError(402, "Attachments require a paid plan", undefined, [
        { message: "Attachments require a paid plan", context: { reason: "PLAN_LIMIT" } },
      ])
    );
    const user = userEvent.setup();
    render({ attachments: [] });

    await user.upload(screen.getByLabelText("Add files"), png());

    expect(
      await screen.findByText(
        "Attachments need a paid plan. Files already attached stay available."
      )
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("note.png")).not.toBeInTheDocument();
  });

  it("reports a transport failure as a retryable upload error", async () => {
    uploadMutate.mockRejectedValue(new UploadError(0, "Upload failed"));
    const user = userEvent.setup();
    render({ attachments: [] });

    await user.upload(screen.getByLabelText("Add files"), png());

    expect(await screen.findByText("Upload failed. Try again.")).toBeInTheDocument();
  });

  it("marks a registered row as failed when its bytes never arrived", async () => {
    uploadMutate.mockRejectedValue(new UploadError(0, "Upload failed", "a-new"));
    const user = userEvent.setup();
    const view = render({ attachments: [] });

    await user.upload(screen.getByLabelText("Add files"), png());
    await waitFor(() => expect(uploadMutate).toHaveBeenCalled());

    view.rerender(
      <AttachmentSection
        detail={{
          ...detail,
          attachments: [{ ...image, id: "a-new", fileName: "note.png", status: "UPLOADING" }],
        }}
      />
    );
    expect(screen.getAllByText("note.png")).toHaveLength(1);
    expect(screen.getByText("Upload failed — the file never arrived.")).toBeInTheDocument();
    expect(screen.queryByText("Checking the file…")).not.toBeInTheDocument();
    expect(screen.queryByText("Upload failed. Try again.")).not.toBeInTheDocument();
  });

  it("opens the picker from the visible button", async () => {
    const user = userEvent.setup();
    render({ attachments: [] });
    const click = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});

    await user.click(screen.getByRole("button", { name: "Add files" }));

    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });

  it("disables the picker once five files hold a slot", () => {
    const five = [1, 2, 3, 4, 5].map((n) => ({ ...image, id: `a-${n}`, fileName: `f${n}.jpg` }));
    render({ attachments: five, canAttach: false });

    expect(screen.getByLabelText("Add files")).toBeDisabled();
    expect(
      screen.getByText("This request has the maximum of five attachments.")
    ).toBeInTheDocument();
  });

  it("replaces the picker with the paid-plan line when the group says uploads are off", () => {
    uploadsAvailable = false;
    render({ canAttach: false });

    expect(screen.queryByLabelText("Add files")).not.toBeInTheDocument();
    expect(
      screen.getByText("Attachments need a paid plan. Files already attached stay available.")
    ).toBeInTheDocument();
  });

  it("says nothing about the plan on a cancelled request, where uploads are closed anyway", () => {
    uploadsAvailable = false;
    render({ canAttach: false, deletedAt: "2026-08-13T09:00:00.000Z" });

    expect(screen.getByText("doctors-note.jpg")).toBeInTheDocument();
    expect(screen.queryByText(/paid plan/)).not.toBeInTheDocument();
  });

  it("shows an approver the list but neither the picker nor the plan line", () => {
    sessionUserId = "u-approver";
    uploadsAvailable = false;
    render({ canAttach: false });

    expect(screen.getByText("doctors-note.jpg")).toBeInTheDocument();
    expect(screen.queryByLabelText("Add files")).not.toBeInTheDocument();
    expect(screen.queryByText(/paid plan/)).not.toBeInTheDocument();
  });

  it("lets an admin editing on the member's behalf attach files", () => {
    sessionUserId = "u-2";
    render({ canEdit: true });

    expect(screen.getByLabelText("Add files")).toBeEnabled();
  });
});
