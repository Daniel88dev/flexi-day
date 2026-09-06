import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Dialog, DialogContent, DialogTitle } from "../dialog";

function renderDialog() {
  render(
    <Dialog open>
      <DialogContent>
        <DialogTitle>Tall form</DialogTitle>
      </DialogContent>
    </Dialog>
  );
  return screen.getByRole("dialog");
}

describe("DialogContent", () => {
  it("caps its height to the dynamic viewport and scrolls inside", () => {
    const content = renderDialog();
    expect(content).toHaveClass("max-h-[calc(100dvh-2rem)]");
    expect(content).toHaveClass("overflow-y-auto");
    expect(content).toHaveClass("overscroll-contain");
    expect(content).toHaveClass("max-sm:scrollbar-hidden");
  });

  it("declares a single shrinkable column and hides horizontal overflow", () => {
    const content = renderDialog();
    expect(content).toHaveClass("grid-cols-1");
    expect(content).toHaveClass("overflow-x-hidden");
  });

  it("tightens padding, gap and radius on a phone", () => {
    const content = renderDialog();
    expect(content).toHaveClass("p-5", "sm:p-6");
    expect(content).toHaveClass("gap-5", "sm:gap-6");
    expect(content).toHaveClass("rounded-3xl", "sm:rounded-4xl");
  });
});
