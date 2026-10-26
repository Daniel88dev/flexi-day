"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { ReadLogEntry, ReadLogFilter } from "@/lib/api/directory";
import { useReadLog } from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";

/** The Read log, for the owner and org admins: reads of Sensitive sections and every export. */
export function ReadLogPanel({ organizationId }: { organizationId: string }) {
  const { t } = useTranslation();
  const copy = t.directory.settings.readLogPanel;
  const [filter, setFilter] = useState<ReadLogFilter>({});
  const log = useReadLog(organizationId, filter, true);
  const pages = log.data?.pages ?? [];
  const entries = pages.flatMap((page) => page.entries);
  const options = pages[0];
  const when = (value: string) =>
    new Date(value).toLocaleString(t.common.dateLocale, { dateStyle: "short", timeStyle: "short" });

  const select = (
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    choices: { value: string; label: string }[]
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-border bg-background h-9 w-full rounded-md border px-3 text-sm"
      >
        <option value="">{copy.everyone}</option>
        {choices.map((choice) => (
          <option key={choice.value} value={choice.value}>
            {choice.label}
          </option>
        ))}
      </select>
    </div>
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
          <table className="w-full text-sm">
            <thead className="text-muted-foreground text-left text-xs">
              <tr>
                <th className="py-2 pr-4 font-normal">{copy.when}</th>
                <th className="py-2 pr-4 font-normal">{copy.reader}</th>
                <th className="py-2 pr-4 font-normal">{copy.person}</th>
                <th className="py-2 pr-4 font-normal">{copy.what}</th>
                <th className="py-2 font-normal">{copy.audience}</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="text-muted-foreground py-2 pr-4 text-xs">
                    <time dateTime={entry.at}>{when(entry.at)}</time>
                  </td>
                  <td className="py-2 pr-4">{entry.reader.name ?? copy.unknownReader}</td>
                  <td className="py-2 pr-4">{entry.person.name ?? copy.erasedPerson}</td>
                  <td className="py-2 pr-4">
                    <What entry={entry} />
                  </td>
                  <td className="py-2">{t.directory.history.audiences[entry.audience]}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
