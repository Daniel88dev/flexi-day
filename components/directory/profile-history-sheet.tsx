"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { DirectoryProfile } from "@/lib/api/directory";
import { useProfileHistory } from "@/lib/api/queries";
import { formatDateTime } from "@/lib/directory/format";
import { useTranslation } from "@/lib/i18n/use-translation";

/** The owner, org admins and HR see who changed which fields; never the values. */
export function ProfileHistorySheet({ profile }: { profile: DirectoryProfile }) {
  const { t } = useTranslation();
  const copy = t.directory.history;
  const [open, setOpen] = useState(false);
  const history = useProfileHistory(profile.organizationId, profile.employmentId, open);
  const when = (value: string) => formatDateTime(value, t.common.dateLocale);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4" aria-hidden />
          {t.directory.profile.history}
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{copy.title(profile.name)}</SheetTitle>
          <SheetDescription>{copy.description}</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          {history.error ? (
            <p className="text-destructive text-sm">{copy.loadFailed}</p>
          ) : !history.data ? (
            <p className="text-muted-foreground text-sm">{t.common.loading}</p>
          ) : history.data.length === 0 ? (
            <p className="text-muted-foreground text-sm">{copy.empty}</p>
          ) : (
            <ol className="divide-border divide-y">
              {history.data.map((entry) => (
                <li key={entry.id} className="grid grid-cols-[max-content_1fr] gap-x-4 py-3">
                  <time dateTime={entry.at} className="text-muted-foreground text-xs">
                    {when(entry.at)}
                  </time>
                  <div className="space-y-0.5">
                    {entry.actor === "RETENTION" || entry.audience === null ? (
                      <p className="font-semibold">{copy.retention}</p>
                    ) : (
                      <p>
                        <span className="font-semibold">
                          {entry.actorName ?? copy.unknownActor}
                        </span>{" "}
                        <span className="text-muted-foreground text-xs">
                          {copy.as(copy.audiences[entry.audience])}
                        </span>
                      </p>
                    )}
                    {entry.section === "CHANGE_WORKER_TYPE" ? (
                      <p>{copy.workerTypeChanged}</p>
                    ) : (
                      <p>
                        {copy.sections[entry.section]}:{" "}
                        {entry.fields.map((field) => copy.fields[field] ?? field).join(", ")}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
