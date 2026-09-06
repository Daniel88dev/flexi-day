import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AttachmentsHeading } from "../attachments-heading";

describe("AttachmentsHeading", () => {
  it("names the field and counts the slots taken", () => {
    render(<AttachmentsHeading as="h3" id="att" used={2} max={5} />);
    expect(screen.getByRole("heading", { level: 3, name: "Attachments" })).toHaveAttribute(
      "id",
      "att"
    );
    expect(screen.getByLabelText("2 of 5 files attached")).toHaveTextContent("2 / 5");
  });
});
