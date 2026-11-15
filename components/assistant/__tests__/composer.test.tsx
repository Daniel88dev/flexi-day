import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Composer } from "../composer";

describe("Composer", () => {
  it("should send the trimmed message on Enter and clear the box", async () => {
    const onSend = vi.fn();
    render(<Composer busy={false} onSend={onSend} />);
    const box = screen.getByRole("textbox", { name: "Message the Assistant" });
    await userEvent.type(box, "  Who's away?  {Enter}");
    expect(onSend).toHaveBeenCalledWith("Who's away?");
    expect(box).toHaveValue("");
  });

  it("should disable the box and the send button while busy", () => {
    render(<Composer busy onSend={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Message the Assistant" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });
});
