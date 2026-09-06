import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AttachmentRow } from "../attachment-row";

describe("AttachmentRow", () => {
  it("shows the name, the meta line and an optional note", () => {
    render(
      <ul>
        <AttachmentRow
          contentType="application/pdf"
          name="note.pdf"
          meta="219 B"
          note="Checking the file…"
        />
      </ul>
    );
    expect(screen.getByText("note.pdf")).toBeInTheDocument();
    expect(screen.getByText("219 B")).toBeInTheDocument();
    expect(screen.getByText("Checking the file…")).toHaveClass("text-muted-foreground");
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("draws a progress bar only when a fraction is given, and tints a destructive note", () => {
    render(
      <ul>
        <AttachmentRow
          contentType="image/png"
          name="scan.png"
          meta="Uploading… 40%"
          note="Upload failed."
          noteTone="destructive"
          progress={0.4}
          progressLabel="scan.png"
        />
      </ul>
    );
    expect(screen.getByRole("progressbar", { name: "scan.png" })).toHaveAttribute(
      "aria-valuenow",
      "40"
    );
    expect(screen.getByText("Upload failed.")).toHaveClass("text-destructive");
  });
});
