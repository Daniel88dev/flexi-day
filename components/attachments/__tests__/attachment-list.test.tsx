import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Attachment } from "@/lib/api/types";
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

  it("shows a row the caller marked as failed without any action", () => {
    render(
      <AttachmentList
        attachments={[{ ...ready, status: "UPLOADING" }]}
        people={[]}
        failedIds={["a-1"]}
      />
    );

    expect(screen.getByText("Upload failed — the file never arrived.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
