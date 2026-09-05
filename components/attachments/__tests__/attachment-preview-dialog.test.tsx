import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AttachmentPreviewDialog } from "../attachment-preview-dialog";

describe("AttachmentPreviewDialog", () => {
  it("shows the image under its file name when open", () => {
    render(
      <AttachmentPreviewDialog
        fileName="note.jpg"
        url="https://files.test/note?sig=1"
        open
        onOpenChange={() => {}}
      />
    );

    expect(screen.getByRole("dialog", { name: "note.jpg" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "note.jpg" })).toHaveAttribute(
      "src",
      "https://files.test/note?sig=1"
    );
  });

  it("renders nothing while closed", () => {
    render(<AttachmentPreviewDialog fileName="" url={null} open={false} onOpenChange={() => {}} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
