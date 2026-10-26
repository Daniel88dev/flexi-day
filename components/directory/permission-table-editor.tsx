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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[60rem] border-collapse text-sm">
        <thead>
          <tr className="text-muted-foreground text-xs uppercase">
            <th scope="col" className="w-44 py-2 text-left font-medium">
              <span className="sr-only">{copy.permissions}</span>
            </th>
            {PERMISSION_AUDIENCES.map((audience) => (
              <th key={audience} scope="col" className="px-1 py-2 text-center font-medium">
                {t.directory.history.audiences[audience]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.lines.sections.map((line) => (
            <Line key={line.row} line={line} {...props} />
          ))}
          <tr>
            <th
              scope="rowgroup"
              colSpan={PERMISSION_AUDIENCES.length + 1}
              className="text-muted-foreground border-t pt-4 pb-1 text-left text-xs font-medium uppercase"
            >
              {copy.acts}
            </th>
          </tr>
          {props.lines.acts.map((line) => (
            <Line key={line.row} line={line} {...props} />
          ))}
        </tbody>
      </table>
    </div>
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
    <tr className="border-t">
      <th scope="row" className="py-2 pr-2 text-left font-semibold">
        {rowName}
      </th>
      {PERMISSION_AUDIENCES.map((audience) => {
        const cell = line.cells[audience];
        const label = copy.cellLabel(rowName, t.directory.history.audiences[audience]);
        if (!cell) {
          return (
            <td key={audience} aria-label={`${label}: ${copy.noCell}`} className="text-center">
              <span className="text-muted-foreground" aria-hidden>
                –
              </span>
            </td>
          );
        }
        const valueName = copy.values[cell.value];
        if (cell.fixed) {
          return (
            <td key={audience} className="px-1 py-1 text-center">
              <span
                aria-label={copy.fixed(valueName)}
                className="border-primary/40 text-primary inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium"
              >
                <Lock className="h-3 w-3" aria-hidden />
                {valueName}
              </span>
            </td>
          );
        }
        if (!editable) {
          return (
            <td key={audience} aria-label={`${label}: ${valueName}`} className="px-1 text-center">
              {valueName}
            </td>
          );
        }
        return (
          <td key={audience} className="px-1 py-1 text-center">
            <select
              aria-label={label}
              value={cell.value}
              disabled={pending}
              onChange={(event) =>
                onChange(cell, event.target.value as PermissionTableCell["value"])
              }
              className="border-border bg-background h-8 w-full min-w-[5.5rem] rounded-md border px-2 text-sm disabled:opacity-50"
            >
              {cellOptions(cell, writable).map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {copy.values[option.value]}
                </option>
              ))}
            </select>
          </td>
        );
      })}
    </tr>
  );
}
