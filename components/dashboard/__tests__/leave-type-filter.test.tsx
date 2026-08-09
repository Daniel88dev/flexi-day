import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeaveTypeFilter } from "../leave-type-filter";
import { DEFAULT_LEAVE_TYPES, type LeaveTypeKey } from "@/lib/demo/leave-meta";
import { VacationKind } from "@/lib/api/types";

function setup(selected: LeaveTypeKey[]) {
  const onChange = vi.fn();
  render(<LeaveTypeFilter value={new Set(selected)} onChange={onChange} />);
  return { onChange };
}

describe("LeaveTypeFilter", () => {
  it("renders a chip per leave type, pressed when selected", () => {
    setup([VacationKind.Vacation]);
    for (const label of ["Vacation", "Home Office", "Sick", "Bank Holiday", "Paid Time Off"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Vacation" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Sick" })).toHaveAttribute("aria-pressed", "false");
  });

  it("removes a type when its chip is clicked", async () => {
    const user = userEvent.setup();
    const { onChange } = setup(DEFAULT_LEAVE_TYPES);

    await user.click(screen.getByRole("button", { name: "Sick" }));

    const next = onChange.mock.calls[0][0] as Set<LeaveTypeKey>;
    expect(next.has(VacationKind.Sick)).toBe(false);
    expect(next.size).toBe(DEFAULT_LEAVE_TYPES.length - 1);
  });

  it("adds a type back when an unselected chip is clicked", async () => {
    const user = userEvent.setup();
    const { onChange } = setup([VacationKind.Vacation]);

    await user.click(screen.getByRole("button", { name: "Home Office" }));

    const next = onChange.mock.calls[0][0] as Set<LeaveTypeKey>;
    expect([...next].sort()).toEqual([VacationKind.HomeOffice, VacationKind.Vacation].sort());
  });

  it("summarises a full selection on the compact trigger", () => {
    setup(DEFAULT_LEAVE_TYPES);
    expect(screen.getByText("All types")).toBeInTheDocument();
  });

  it("shows a count when only some types are selected", () => {
    setup([VacationKind.Vacation, VacationKind.Sick]);
    expect(screen.getByText("2 types")).toBeInTheDocument();
  });

  it("shows an empty state when nothing is selected", () => {
    setup([]);
    expect(screen.getByText("No types")).toBeInTheDocument();
  });

  it("toggles types from the menu without closing it", async () => {
    const user = userEvent.setup();
    const { onChange } = setup(DEFAULT_LEAVE_TYPES);

    await user.click(screen.getByRole("button", { name: "Filter leave types" }));
    const items = await screen.findAllByRole("menuitemcheckbox");
    expect(items).toHaveLength(DEFAULT_LEAVE_TYPES.length);

    await user.click(screen.getByRole("menuitemcheckbox", { name: "Sick" }));

    const next = onChange.mock.calls[0][0] as Set<LeaveTypeKey>;
    expect(next.has(VacationKind.Sick)).toBe(false);
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("clears everything from the menu when all types are on", async () => {
    const user = userEvent.setup();
    const { onChange } = setup(DEFAULT_LEAVE_TYPES);

    await user.click(screen.getByRole("button", { name: "Filter leave types" }));
    await user.click(await screen.findByRole("menuitem", { name: "Clear all" }));

    expect((onChange.mock.calls[0][0] as Set<LeaveTypeKey>).size).toBe(0);
  });

  it("selects everything from the menu when some types are off", async () => {
    const user = userEvent.setup();
    const { onChange } = setup([VacationKind.Vacation]);

    await user.click(screen.getByRole("button", { name: "Filter leave types" }));
    await user.click(await screen.findByRole("menuitem", { name: "Select all" }));

    expect((onChange.mock.calls[0][0] as Set<LeaveTypeKey>).size).toBe(DEFAULT_LEAVE_TYPES.length);
  });
});
