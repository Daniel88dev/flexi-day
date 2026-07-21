import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { VacationKind } from "@/lib/api/types";
import { TypeBadge } from "../type-badge";
import { EmptyState } from "../empty-state";
import { ConfirmDialog } from "../confirm-dialog";
import { DirectSyncSection } from "../direct-sync-section";
import { SwatchPicker } from "../swatch-picker";

describe("TypeBadge", () => {
  it("renders the type label", () => {
    render(<TypeBadge type={VacationKind.Vacation} />);
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
    render(
      <ConfirmDialog kind="delete" name="My feed" onClose={vi.fn()} onConfirm={onConfirm} />
    );
    expect(screen.getByText("Delete this calendar?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("shows the regenerate copy", () => {
    render(<ConfirmDialog kind="regen" name="My feed" onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByText("Regenerate the token?")).toBeInTheDocument();
  });
});

describe("DirectSyncSection", () => {
  it("renders the coming-soon section", () => {
    render(<DirectSyncSection />);
    expect(screen.getByText("Direct sync")).toBeInTheDocument();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
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
