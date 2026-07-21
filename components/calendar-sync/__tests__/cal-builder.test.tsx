import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { newBuilderConfig } from "@/lib/calendar-sync/meta";
import { CalBuilder, type MonthContext } from "../cal-builder";

const monthCtx: MonthContext = {
  year: 2026,
  month: 7,
  label: "July 2026",
  days: 31,
  firstWeekdayMondayIdx: 2,
};

function renderBuilder(overrides?: { onClose?: () => void; onSubmit?: () => Promise<never> }) {
  return render(
    <CalBuilder
      initial={newBuilderConfig()}
      isNew
      groups={[]}
      vacations={[]}
      currentUserId="u1"
      monthCtx={monthCtx}
      onClose={overrides?.onClose ?? vi.fn()}
      onSubmit={overrides?.onSubmit ?? vi.fn()}
    />
  );
}

describe("CalBuilder", () => {
  it("renders the new-calendar form with record types", () => {
    renderBuilder();
    expect(screen.getByText("New calendar")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/My time off/)).toBeInTheDocument();
    expect(screen.getByText("Vacation")).toBeInTheDocument();
  });

  it("blocks submit and shows a name error when the name is empty", () => {
    const onSubmit = vi.fn();
    renderBuilder({ onSubmit });
    fireEvent.click(screen.getByRole("button", { name: /Save & get link/ }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Give your calendar a name.")).toBeInTheDocument();
  });

  it("closes via Cancel", () => {
    const onClose = vi.fn();
    renderBuilder({ onClose });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });
});
