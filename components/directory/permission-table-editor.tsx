"use client";

import { Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { errorCopy } from "@/lib/api/client";
import type { PermissionTableCell } from "@/lib/api/directory";
import { usePermissionTable, useUpdatePermissionCell } from "@/lib/api/queries";
import {
  cellOptions,
  PERMISSION_AUDIENCES,
  permissionGrid,
  type PermissionLine,
} from "@/lib/directory/permission-table";
import { LapsedNote } from "@/components/directory/directory-lapsed-banner";
import { useTranslation } from "@/lib/i18n/use-translation";
import { SelectField } from "@/components/directory/form-fields";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** The organization's Permission table: the owner edits it, org admins and HR read it. */
export function PermissionTableEditor({ organizationId }: { organizationId: string }) {
  const { t } = useTranslation();
  const copy = t.directory.settings;
  const table = usePermissionTable(organizationId, true);
  const update = useUpdatePermissionCell(organizationId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.permissions}</CardTitle>
        <CardDescription>{copy.permissionsIntro}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {table.error ? (
          <p className="text-destructive text-sm">{copy.loadFailed}</p>
        ) : !table.data ? (
          <p className="text-muted-foreground text-sm">{t.common.loading}</p>
        ) : (
          <>
            {!table.data.editable ? (
              <p className="text-muted-foreground text-sm">{copy.readOnlyNote}</p>
            ) : !table.data.writable ? (
              <LapsedNote>{copy.lapsedNote}</LapsedNote>
            ) : null}
            {update.error ? (
              <p role="alert" className="text-destructive text-sm">
                {errorCopy(update.error, copy.errors, copy.saveFailed)}
              </p>
            ) : null}
            <Grid
              lines={permissionGrid(table.data.cells)}
              editable={table.data.editable}
              writable={table.data.writable}
              pending={update.isPending}
              onChange={(cell, value) =>
                update.mutate({ row: cell.row, audience: cell.audience, value })
              }
            />
            <p className="text-muted-foreground text-xs">{copy.legend}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

type GridProps = {
  lines: { sections: PermissionLine[]; acts: PermissionLine[] };
  editable: boolean;
  writable: boolean;
  pending: boolean;
  onChange: (cell: PermissionTableCell, value: PermissionTableCell["value"]) => void;
};

function Grid(props: GridProps) {
  const { t } = useTranslation();
  const copy = t.directory.settings;
  return (
    <Table className="min-w-[60rem]">
      <TableHeader>
        <TableRow className="text-muted-foreground text-xs uppercase hover:bg-transparent">
          <TableHead scope="col" className="text-muted-foreground h-auto w-44 px-0 py-2">
            <span className="sr-only">{copy.permissions}</span>
          </TableHead>
          {PERMISSION_AUDIENCES.map((audience) => (
            <TableHead
              key={audience}
              scope="col"
              className="text-muted-foreground h-auto px-1 py-2 text-center"
            >
              {t.directory.history.audiences[audience]}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.lines.sections.map((line) => (
          <Line key={line.row} line={line} {...props} />
        ))}
        <TableRow className="hover:bg-transparent">
          <TableHead
            scope="rowgroup"
            colSpan={PERMISSION_AUDIENCES.length + 1}
            className="text-muted-foreground h-auto px-0 pt-4 pb-1 text-xs uppercase"
          >
            {copy.acts}
          </TableHead>
        </TableRow>
        {props.lines.acts.map((line) => (
          <Line key={line.row} line={line} {...props} />
        ))}
      </TableBody>
    </Table>
  );
}

function Line({
  line,
  editable,
  writable,
  pending,
  onChange,
}: GridProps & { line: PermissionLine }) {
  const { t } = useTranslation();
  const copy = t.directory.settings;
  const rowName = copy.rows[line.row];
  return (
    <TableRow className="hover:bg-transparent">
      <TableHead scope="row" className="h-auto px-0 py-2 pr-2 font-semibold whitespace-normal">
        {rowName}
      </TableHead>
      {PERMISSION_AUDIENCES.map((audience) => {
        const cell = line.cells[audience];
        const label = copy.cellLabel(rowName, t.directory.history.audiences[audience]);
        if (!cell) {
          return (
            <TableCell
              key={audience}
              aria-label={`${label}: ${copy.noCell}`}
              className="px-1 py-1 text-center whitespace-normal"
            >
              <span className="text-muted-foreground" aria-hidden>
                –
              </span>
            </TableCell>
          );
        }
        const valueName = copy.values[cell.value];
        if (cell.fixed) {
          return (
            <TableCell key={audience} className="px-1 py-1 text-center whitespace-normal">
              <span
                aria-label={copy.fixed(valueName)}
                className="border-primary/40 text-primary inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium"
              >
                <Lock className="h-3 w-3" aria-hidden />
                {valueName}
              </span>
            </TableCell>
          );
        }
        if (!editable) {
          return (
            <TableCell
              key={audience}
              aria-label={`${label}: ${valueName}`}
              className="px-1 py-1 text-center whitespace-normal"
            >
              {valueName}
            </TableCell>
          );
        }
        return (
          <TableCell key={audience} className="px-1 py-1 text-center whitespace-normal">
            <SelectField
              aria-label={label}
              value={cell.value}
              disabled={pending}
              onChange={(value) => onChange(cell, value as PermissionTableCell["value"])}
              className="min-w-[5.5rem]"
            >
              {cellOptions(cell, writable).map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {copy.values[option.value]}
                </option>
              ))}
            </SelectField>
          </TableCell>
        );
      })}
    </TableRow>
  );
}
