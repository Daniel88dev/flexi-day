import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AttachmentUploader } from "../attachment-uploader";

vi.mock("@/lib/api/queries", () => ({
  useUploadAttachment: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe("AttachmentUploader", () => {
  it("renders the picker, the format hint and the visibility notice", () => {
    render(<AttachmentUploader requestId="r-1" attachments={[]} />);

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

  it("is inert when disabled", () => {
    render(<AttachmentUploader requestId="r-1" attachments={[]} disabled />);

    expect(screen.getByRole("button", { name: "Add files" })).toBeDisabled();
    expect(screen.getByLabelText("Add files")).toBeDisabled();
  });
});
