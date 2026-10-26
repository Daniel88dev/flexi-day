import type {
  DirectoryAudience,
  PermissionRow,
  PermissionTableCell,
  PermissionValue,
} from "@/lib/api/directory";

export const PERMISSION_AUDIENCES: DirectoryAudience[] = [
  "OWNER",
  "SELF",
  "COLLEAGUE",
  "EXTERNAL_WORKER",
  "GROUP_ADMIN",
  "HR",
  "LEADERSHIP",
  "ORGANIZATION_ADMIN",
];

export const SECTION_PERMISSION_ROWS: PermissionRow[] = [
  "CARD",
  "PHOTO",
  "WORK_CONTACT",
  "JOB",
  "CONTACT",
  "PERSONAL",
];

export const ACT_PERMISSION_ROWS: PermissionRow[] = [
  "CREATE_ACCOUNTLESS_PERSON",
  "SEND_DIRECTORY_INVITE",
  "CHANGE_WORKER_TYPE",
  "END_EMPLOYMENT",
  "MANAGE_DEPARTMENTS_AND_LOCATIONS",
];

const RANK: Record<PermissionValue, number> = { NONE: 0, READ: 1, WRITE: 2, NO: 0, ALLOWED: 1 };

export const widens = (before: PermissionValue, after: PermissionValue) =>
  RANK[after] > RANK[before];

/** The owner's choices for one cell; while lapsed, a choice that widens it is disabled. */
export const cellOptions = (cell: PermissionTableCell, writable: boolean) =>
  cell.options.map((value) => ({ value, disabled: !writable && widens(cell.value, value) }));

export type PermissionLine = {
  row: PermissionRow;
  cells: Partial<Record<DirectoryAudience, PermissionTableCell>>;
};

const linesFor = (rows: PermissionRow[], cells: PermissionTableCell[]): PermissionLine[] =>
  rows.flatMap((row) => {
    const own = cells.filter((cell) => cell.row === row);
    if (own.length === 0) return [];
    return [{ row, cells: Object.fromEntries(own.map((cell) => [cell.audience, cell])) }];
  });

/** The table's cells laid out as Section lines, then act lines. */
export const permissionGrid = (cells: PermissionTableCell[]) => ({
  sections: linesFor(SECTION_PERMISSION_ROWS, cells),
  acts: linesFor(ACT_PERMISSION_ROWS, cells),
});
