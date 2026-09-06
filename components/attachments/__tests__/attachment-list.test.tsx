import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api/client";
import type { Attachment } from "@/lib/api/types";
import { getAttachmentDownloadUrl } from "@/lib/api/attachments";
import { AttachmentList } from "../attachment-list";

vi.mock("@/lib/api/attachments", () => ({ getAttachmentDownloadUrl: vi.fn() }));

const ready: Attachment = {
  id: "a-1",
  requestId: "r-1",
  fileName: "note.jpg",
  contentType: "image/jpeg",
  size: 3072,
  status: "READY",
  rejectionReason: null,
  uploadedByUserId: "u-1",
  createdAt: "2026-09-05T09:00:00.000Z",
  deletedAt: null,
  deletedByUserId: null,
};

describe("AttachmentList", () => {
  it("renders a ready file as an openable row with its size, uploader and time", () => {
    render(
      <AttachmentList
        attachments={[ready]}
        people={[{ id: "u-1", name: "Dana Holt", initials: "DH", avatarColor: "x" }]}
      />
    );

    expect(screen.getByRole("button", { name: "Preview note.jpg" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download note.jpg" })).toBeInTheDocument();
    expect(screen.getByText(/^3 kB · Uploaded by Dana Holt · .*2026/)).toBeInTheDocument();
  });

  it("tells a removed account from an admin the detail cannot name", () => {
    render(
      <AttachmentList
        attachments={[ready, { ...ready, id: "a-2", fileName: "b.jpg", uploadedByUserId: null }]}
        people={[]}
      />
    );

    expect(screen.getByText(/Uploaded by an admin/)).toBeInTheDocument();
    expect(screen.getByText(/Uploaded by a removed account/)).toBeInTheDocument();
  });

  it("closes the tab it opened for a PDF when no URL comes back", async () => {
    const tab = { opener: {}, location: { href: "" }, close: vi.fn() };
    vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
    vi.mocked(getAttachmentDownloadUrl).mockRejectedValue(new ApiError(500, "boom"));
    const user = userEvent.setup();
    render(
      <AttachmentList
        attachments={[{ ...ready, fileName: "note.pdf", contentType: "application/pdf" }]}
        people={[]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Open note.pdf" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Couldn't open"));
    expect(tab.close).toHaveBeenCalledTimes(1);
    vi.restoreAllMocks();
  });

  it("lets the server's READY win over a transfer the browser thought lost", () => {
    render(<AttachmentList attachments={[ready]} people={[]} failedIds={["a-1"]} />);

    expect(screen.getByRole("button", { name: "Preview note.jpg" })).toBeInTheDocument();
    expect(screen.queryByText(/Upload failed/)).not.toBeInTheDocument();
  });

  it("shows a row the caller marked as failed without any action", () => {
    render(
      <AttachmentList
        attachments={[{ ...ready, status: "UPLOADING" }]}
        people={[]}
        failedIds={["a-1"]}
      />
    );

    expect(screen.getByText("Upload failed. The file did not arrive.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows Delete only where the caller allows it, and asks before calling back", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <AttachmentList
        attachments={[ready, { ...ready, id: "a-2", fileName: "other.jpg" }]}
        people={[]}
        canDelete={(attachment) => attachment.id === "a-1"}
        onDelete={onDelete}
      />
    );

    expect(screen.queryByRole("button", { name: "Delete other.jpg" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete note.jpg" }));

    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(ready);
    vi.restoreAllMocks();
  });

  it("does not call back when the confirmation is declined", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(
      <AttachmentList
        attachments={[ready]}
        people={[]}
        canDelete={() => true}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole("button", { name: "Delete note.jpg" }));

    expect(onDelete).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("reports a delete that failed", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onDelete = vi.fn().mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    render(
      <AttachmentList
        attachments={[ready]}
        people={[]}
        canDelete={() => true}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole("button", { name: "Delete note.jpg" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Couldn't delete the file. Try again.")
    );
    expect(screen.getByRole("button", { name: "Delete note.jpg" })).toBeEnabled();
    vi.restoreAllMocks();
  });

  it("says who may delete when the backend refuses", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onDelete = vi.fn().mockRejectedValue(new ApiError(403, "Not allowed"));
    const user = userEvent.setup();
    render(
      <AttachmentList
        attachments={[ready]}
        people={[]}
        canDelete={() => true}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole("button", { name: "Delete note.jpg" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Only the person who uploaded this file or a group admin can delete it."
      )
    );
    vi.restoreAllMocks();
  });

  it("stays quiet when someone else removed the row first", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onDelete = vi.fn().mockRejectedValue(new ApiError(409, "Attachment was already deleted"));
    const user = userEvent.setup();
    render(
      <AttachmentList
        attachments={[ready]}
        people={[]}
        canDelete={() => true}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole("button", { name: "Delete note.jpg" }));

    await waitFor(() => expect(onDelete).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
