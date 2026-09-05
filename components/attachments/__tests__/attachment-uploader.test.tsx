import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AttachmentUploads } from "@/lib/attachments/use-attachment-uploads";
import { AttachmentUploader } from "../attachment-uploader";

function uploads(overrides: Partial<AttachmentUploads> = {}): AttachmentUploads {
  return {
    jobs: [],
    failedIds: [],
    queued: 0,
    inFlight: 0,
    failed: 0,
    remaining: 5,
    full: false,
    pick: vi.fn(),
    start: vi.fn(),
    remove: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  };
}

const job = { key: 1, fileName: "note.png", contentType: "image/png", size: 4, progress: 0.4 };

describe("AttachmentUploader", () => {
  it("renders the picker, the format hint and the visibility notice", () => {
    render(<AttachmentUploader uploads={uploads()} />);

    expect(screen.getByRole("button", { name: "Add files" })).toBeEnabled();
    expect(screen.getByLabelText("Add files")).toHaveAttribute(
      "accept",
      expect.stringContaining("application/pdf")
    );
    expect(
      screen.getByText("PNG, JPEG, WebP, HEIC or PDF, up to 10 MB each, five per request.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("The group's approvers and managers will see this file.")
    ).toBeInTheDocument();
  });

  it("is inert when disabled or full", () => {
    const { rerender } = render(<AttachmentUploader uploads={uploads()} disabled />);
    expect(screen.getByRole("button", { name: "Add files" })).toBeDisabled();
    expect(screen.getByLabelText("Add files")).toBeDisabled();

    rerender(<AttachmentUploader uploads={uploads({ remaining: 0, full: true })} />);
    expect(screen.getByRole("button", { name: "Add files" })).toBeDisabled();
    expect(
      screen.getByText("This request has the maximum of five attachments.")
    ).toBeInTheDocument();
  });

  it("hands picked files to the uploads", async () => {
    const state = uploads();
    const user = userEvent.setup();
    render(<AttachmentUploader uploads={state} />);

    await user.upload(
      screen.getByLabelText("Add files"),
      new File(["x"], "note.png", { type: "image/png" })
    );

    expect(state.pick).toHaveBeenCalledTimes(1);
  });

  it("shows a waiting file with a remove button and no progress", async () => {
    const state = uploads({ jobs: [{ ...job, progress: 0, queued: true }], queued: 1 });
    const user = userEvent.setup();
    render(<AttachmentUploader uploads={state} />);

    expect(screen.getByText("note.png")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove note.png" }));
    expect(state.remove).toHaveBeenCalledWith(1);
  });

  it("shows progress for a file in flight and the check once its bytes are in", () => {
    const { rerender } = render(
      <AttachmentUploader uploads={uploads({ jobs: [{ ...job, queued: false }], inFlight: 1 })} />
    );

    expect(screen.getByRole("progressbar", { name: "note.png" })).toHaveAttribute(
      "aria-valuenow",
      "40"
    );
    expect(screen.getByText("Uploading… 40%")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /note.png/ })).not.toBeInTheDocument();

    rerender(
      <AttachmentUploader
        uploads={uploads({ jobs: [{ ...job, queued: false, progress: 1 }], inFlight: 1 })}
      />
    );
    expect(screen.getByText("Checking the file…")).toBeInTheDocument();
  });

  it("shows a failed file with its reason and a dismiss button", async () => {
    const state = uploads({
      jobs: [{ ...job, queued: false, error: "This file is over 10 MB." }],
      failed: 1,
    });
    const user = userEvent.setup();
    render(<AttachmentUploader uploads={state} />);

    expect(screen.getByText("This file is over 10 MB.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(state.remove).toHaveBeenCalledWith(1);
  });
});
