"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReadLogEntry, ReadLogFilter } from "@/lib/api/directory";
import { useReadLog } from "@/lib/api/queries";
import { formatDateTime } from "@/lib/directory/format";
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
import { cn } from "@/lib/utils";

const HEAD = "text-muted-foreground h-auto py-2 pr-4 pl-0 font-normal last:pr-0";
const CELL = "py-2 pr-4 pl-0 whitespace-normal last:pr-0";

/** The Read log, for the owner and org admins: reads of Sensitive sections and every export. */
export function ReadLogPanel({ organizationId }: { organizationId: string }) {
  const { t } = useTranslation();
  const copy = t.directory.settings.readLogPanel;
  const [filter, setFilter] = useState<ReadLogFilter>({});
  const log = useReadLog(organizationId, filter, true);
  const pages = log.data?.pages ?? [];
  const entries = pages.flatMap((page) => page.entries);
  const options = pages[0];
  const when = (value: string) => formatDateTime(value, t.common.dateLocale);

  const select = (
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    choices: { value: string; label: string }[]
  ) => (
    <SelectField id={id} label={label} value={value} onChange={onChange}>
      <option value="">{copy.everyone}</option>
      {choices.map((choice) => (
        <option key={choice.value} value={choice.value}>
          {choice.label}
        </option>
      ))}
    </SelectField>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {copy.title}
          <Badge variant="secondary">{t.directory.settings.readLogReaders}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">{copy.intro}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {select(
            "read-log-person",
            copy.person,
            filter.employmentId ?? "",
            (value) => setFilter((current) => ({ ...current, employmentId: value || undefined })),
            (options?.people ?? []).map((person) => ({
              value: person.employmentId,
              label: person.name,
            }))
          )}
          {select(
            "read-log-reader",
            copy.reader,
            filter.readerUserId ?? "",
            (value) => setFilter((current) => ({ ...current, readerUserId: value || undefined })),
            (options?.readers ?? []).map((reader) => ({
              value: reader.userId,
              label: reader.name ?? copy.unknownReader,
            }))
          )}
        </div>
        {log.error ? (
          <p className="text-destructive text-sm">{copy.loadFailed}</p>
        ) : !log.data ? (
          <p className="text-muted-foreground text-sm">{t.common.loading}</p>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground text-sm">{copy.empty}</p>
        ) : (
          <Table>
            <TableHeader className="text-xs">
              <TableRow className="hover:bg-transparent">
                <TableHead className={HEAD}>{copy.when}</TableHead>
                <TableHead className={HEAD}>{copy.reader}</TableHead>
                <TableHead className={HEAD}>{copy.person}</TableHead>
                <TableHead className={HEAD}>{copy.what}</TableHead>
                <TableHead className={HEAD}>{copy.audience}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-transparent">
                  <TableCell className={cn(CELL, "text-muted-foreground text-xs")}>
                    <time dateTime={entry.at}>{when(entry.at)}</time>
                  </TableCell>
                  <TableCell className={CELL}>{entry.reader.name ?? copy.unknownReader}</TableCell>
                  <TableCell className={CELL}>{entry.person.name ?? copy.erasedPerson}</TableCell>
                  <TableCell className={CELL}>
                    <What entry={entry} />
                  </TableCell>
                  <TableCell className={CELL}>
                    {t.directory.history.audiences[entry.audience]}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {log.hasNextPage ? (
          <Button
            variant="outline"
            size="sm"
            disabled={log.isFetchingNextPage}
            onClick={() => void log.fetchNextPage()}
          >
            {copy.older}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function What({ entry }: { entry: ReadLogEntry }) {
  const { t } = useTranslation();
  const copy = t.directory.settings.readLogPanel;
  if (entry.kind === "export") return copy.exported;
  const sections = (entry.sections ?? [])
    .map((section) => t.directory.history.sections[section])
    .join(", ");
  return copy.opened(sections);
}
