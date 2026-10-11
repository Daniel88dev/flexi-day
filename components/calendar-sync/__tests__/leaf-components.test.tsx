import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CalendarRecordType } from "@/lib/api/types";
import { TypeBadge } from "../type-badge";
import { EmptyState } from "../empty-state";
import { ConfirmDialog } from "../confirm-dialog";
import { SwatchPicker } from "../swatch-picker";

describe("TypeBadge", () => {
  it("renders the type label", () => {
    render(<TypeBadge type={CalendarRecordType.Vacation} />);
    expect(screen.getByText("Vacation")).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders and fires onCreate", () => {
    const onCreate = vi.fn();
    render(<EmptyState onCreate={onCreate} />);
    expect(screen.getByText("No calendars yet")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Create your first calendar"));
    expect(onCreate).toHaveBeenCalledOnce();
  });
});

describe("ConfirmDialog", () => {
  it("shows the delete copy and confirms", () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog kind="delete" name="My feed" onClose={vi.fn()} onConfirm={onConfirm} />);
    expect(screen.getByText("Delete this calendar?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("shows the disconnect copy for the provider", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog kind="disconnect" name="Google" onClose={vi.fn()} onConfirm={onConfirm} />
    );
    expect(screen.getByText("Disconnect from Google?")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Every event Flexi Day wrote to this calendar will be removed. Nothing else in your calendar is touched."
      )
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("names how many calendars a disconnect empties when the provider syncs several", () => {
    render(
      <ConfirmDialog
        kind="disconnect"
        name="Google"
        syncedCount={2}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(
      screen.getByText(
        "Every event Flexi Day wrote to the 2 calendars synced through this Google account will be removed. Nothing else in your calendars is touched."
      )
    ).toBeInTheDocument();
  });

  it("shows the regenerate copy", () => {
    render(<ConfirmDialog kind="regen" name="My feed" onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByText("Regenerate the token?")).toBeInTheDocument();
  });
});

describe("SwatchPicker", () => {
  it("opens the palette and selects a swatch", () => {
    const onChange = vi.fn();
    render(<SwatchPicker label="Vacation" value="violet" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Vacation: Violet/ }));
    fireEvent.click(screen.getByRole("button", { name: "Rose" }));
    expect(onChange).toHaveBeenCalledWith("rose");
  });
});
