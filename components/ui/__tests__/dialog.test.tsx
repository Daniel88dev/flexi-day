import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Dialog, DialogContent, DialogTitle } from "../dialog";

describe("DialogContent", () => {
  it("caps its height to the dynamic viewport and scrolls inside", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Tall form</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const content = screen.getByRole("dialog");
    expect(content).toHaveClass("max-h-[calc(100dvh-2rem)]");
    expect(content).toHaveClass("overflow-y-auto");
    expect(content).toHaveClass("overscroll-contain");
    expect(content).toHaveClass("max-sm:scrollbar-hidden");
  });
});
