import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "../checkbox";

describe("Checkbox", () => {
  it("renders unchecked and reports a check on click", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox aria-label="Half day" onCheckedChange={onCheckedChange} />);

    const box = screen.getByRole("checkbox", { name: "Half day" });
    expect(box).not.toBeChecked();

    await user.click(box);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("ignores clicks when disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox aria-label="Locked" disabled onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole("checkbox", { name: "Locked" }));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
