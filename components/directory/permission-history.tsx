"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PermissionHistoryEntry, PermissionValue } from "@/lib/api/directory";
import { usePermissionHistory } from "@/lib/api/queries";
import { formatDateTime } from "@/lib/directory/format";
import { useTranslation } from "@/lib/i18n/use-translation";

/** Every change to the Permission table and the Directory roles, newest first. */
export function PermissionHistory({ organizationId }: { organizationId: string }) {
  const { t } = useTranslation();
  const copy = t.directory.settings.history;
  const history = usePermissionHistory(organizationId, true);
  const when = (value: string) => formatDateTime(value, t.common.dateLocale);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {copy.title}
          <Badge variant="secondary">{copy.readers}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.error ? (
          <p className="text-destructive text-sm">{copy.loadFailed}</p>
        ) : !history.data ? (
          <p className="text-muted-foreground text-sm">{t.common.loading}</p>
        ) : history.data.length === 0 ? (
          <p className="text-muted-foreground text-sm">{copy.empty}</p>
        ) : (
          <ol aria-label={copy.title} className="divide-border divide-y text-sm">
            {history.data.map((entry) => (
              <li
                key={entry.id}
                className="grid gap-x-4 py-2 sm:grid-cols-[9rem_10rem_1fr] sm:items-baseline"
              >
                <time dateTime={entry.at} className="text-muted-foreground text-xs">
                  {when(entry.at)}
                </time>
                <span className="font-medium">{entry.actorName ?? copy.automatic}</span>
                <span>
                  <HistoryLine entry={entry} />
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function HistoryLine({ entry }: { entry: PermissionHistoryEntry }) {
  const { t } = useTranslation();
  const copy = t.directory.settings;
  if (entry.kind === "CELL") {
    const value = (v: PermissionValue | null) => (v === null ? "–" : copy.values[v]);
    return copy.history.cell(
      copy.rows[entry.row],
      t.directory.history.audiences[entry.audience],
      value(entry.before),
      value(entry.after)
    );
  }
  const role = t.directory.profile.directoryRoleNames[entry.role];
  const person = entry.personName ?? copy.history.erasedPerson;
  if (entry.after) return copy.history.assigned(role, person);
  if (entry.reason === "EMPLOYMENT_ENDED") return copy.history.ended(role, person);
  if (entry.reason === "ACCOUNT_DELETED") return copy.history.accountDeleted(role, person);
  return copy.history.removed(role, person);
}
