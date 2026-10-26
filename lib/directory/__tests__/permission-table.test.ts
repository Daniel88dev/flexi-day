import { describe, expect, it } from "vitest";
import type { PermissionTableCell } from "@/lib/api/directory";
import { cellOptions, permissionGrid, widens } from "../permission-table";

const cell = (overrides: Partial<PermissionTableCell>): PermissionTableCell => ({
  row: "JOB",
  audience: "LEADERSHIP",
  value: "READ",
  fixed: false,
  options: ["NONE", "READ", "WRITE"],
  ...overrides,
});

describe("widens", () => {
  it("orders none, read, write and no, allowed", () => {
    expect(widens("READ", "WRITE")).toBe(true);
    expect(widens("NONE", "READ")).toBe(true);
    expect(widens("WRITE", "NONE")).toBe(false);
    expect(widens("READ", "READ")).toBe(false);
    expect(widens("NO", "ALLOWED")).toBe(true);
    expect(widens("ALLOWED", "NO")).toBe(false);
  });
});

describe("cellOptions", () => {
  it("offers every option while the plan passes", () => {
    expect(cellOptions(cell({}), true)).toEqual([
      { value: "NONE", disabled: false },
      { value: "READ", disabled: false },
      { value: "WRITE", disabled: false },
    ]);
  });

  it("disables the options that widen the cell while lapsed", () => {
    expect(cellOptions(cell({}), false)).toEqual([
      { value: "NONE", disabled: false },
      { value: "READ", disabled: false },
      { value: "WRITE", disabled: true },
    ]);
    expect(
      cellOptions(cell({ row: "END_EMPLOYMENT", value: "NO", options: ["NO", "ALLOWED"] }), false)
    ).toEqual([
      { value: "NO", disabled: false },
      { value: "ALLOWED", disabled: true },
    ]);
  });
});

describe("permissionGrid", () => {
  it("puts the Sections first, then the acts, each with its cells by audience", () => {
    const grid = permissionGrid([
      cell({ row: "END_EMPLOYMENT", audience: "HR", value: "ALLOWED", options: ["NO", "ALLOWED"] }),
      cell({ row: "CARD", audience: "OWNER", value: "WRITE", fixed: true, options: ["WRITE"] }),
      cell({ row: "CARD", audience: "COLLEAGUE", options: ["NONE", "READ"] }),
    ]);

    expect(grid.sections.map((line) => line.row)).toEqual(["CARD"]);
    expect(grid.acts.map((line) => line.row)).toEqual(["END_EMPLOYMENT"]);
    expect(grid.sections[0]!.cells.OWNER?.fixed).toBe(true);
    expect(grid.sections[0]!.cells.COLLEAGUE?.value).toBe("READ");
    expect(grid.sections[0]!.cells.HR).toBeUndefined();
    expect(grid.acts[0]!.cells.HR?.value).toBe("ALLOWED");
  });
});
