import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarRecordTypePicker } from "../calendar-record-type-picker";
import { CalendarRecordType } from "@/lib/api/types";

describe("CalendarRecordTypePicker", () => {
  it("renders the everyday types and Others as tabs", () => {
    render(<CalendarRecordTypePicker value={null} onChange={() => {}} idPrefix="type" />);

    for (const name of ["Vacation", "Home Office", "Sick", "Others"]) {
      expect(screen.getByRole("tab", { name })).toBeInTheDocument();
    }
  });

  it("reveals the Others select only while no primary type is picked", () => {
    // Two comboboxes when Others is open (the mobile top-level select plus the
    // Others select), one otherwise.
    const { rerender } = render(
      <CalendarRecordTypePicker value={null} onChange={() => {}} idPrefix="type" />
    );
    expect(screen.getAllByRole("combobox")).toHaveLength(2);

    rerender(
      <CalendarRecordTypePicker
        value={CalendarRecordType.Vacation}
        onChange={() => {}}
        idPrefix="type"
      />
    );
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
  });

  it("offers Sick day under Others when the benefit is active", async () => {
    const user = userEvent.setup();
    render(
      <CalendarRecordTypePicker value={null} onChange={() => {}} idPrefix="type" offerSickDay />
    );

    await user.click(screen.getByRole("combobox", { name: "Others" }));
    expect(screen.getByRole("option", { name: "Sick day" })).toBeInTheDocument();
  });

  it("keeps Sick day out of Others by default", async () => {
    const user = userEvent.setup();
    render(<CalendarRecordTypePicker value={null} onChange={() => {}} idPrefix="type" />);

    await user.click(screen.getByRole("combobox", { name: "Others" }));
    expect(screen.getByRole("option", { name: "Other" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Sick day" })).toBeNull();
  });
});
