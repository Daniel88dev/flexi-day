"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { pushToast } from "@/components/toast";
import { PEOPLE_CARD_ANCHOR } from "@/components/organization/people-card";
import { errorCopy } from "@/lib/api/client";
import { useDisableDirectory, useEmployments } from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";

/** The owner's turn-off: it ends nobody, and names who stays employed with no group. */
export function TurnOffDirectoryDialog({
  open,
  onOpenChange,
  organizationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}) {
  const { t } = useTranslation();
  const copy = t.organization.directory.turnOffDialog;
  const disable = useDisableDirectory(organizationId);
  const roster = useEmployments(organizationId);
  const [error, setError] = useState<string | null>(null);
  const unlinked = (roster.data ?? []).filter(
    (employment) => employment.noLink && !employment.ended
  );

  async function submit() {
    setError(null);
    try {
      await disable.mutateAsync();
      pushToast(copy.done);
      onOpenChange(false);
    } catch (err) {
      setError(errorCopy(err, {}, copy.failed));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.body}</DialogDescription>
        </DialogHeader>

        <p className="text-sm">{copy.derived}</p>

        {unlinked.length > 0 ? (
          <div className="bg-muted/50 space-y-2 rounded-[var(--radius-sm)] p-3 text-sm">
            <p id="turn-off-unlinked">{copy.unlinked(unlinked.length)}</p>
            <ul aria-labelledby="turn-off-unlinked" className="space-y-1">
              {unlinked.map((employment) => (
                <li key={employment.id} className="flex flex-wrap items-center gap-2">
                  {employment.user.name}
                  {employment.userId === null ? (
                    <Badge variant="outline">{t.directory.markers.NO_ACCOUNT}</Badge>
                  ) : null}
                  {employment.type === "external" ? (
                    <Badge variant="outline">{t.directory.markers.EXTERNAL_WORKER}</Badge>
                  ) : null}
                </li>
              ))}
            </ul>
            <Link
              href={`#${PEOPLE_CARD_ANCHOR}`}
              onClick={() => onOpenChange(false)}
              className="text-primary font-semibold underline-offset-2 hover:underline"
            >
              {copy.reviewOnPeopleCard}
            </Link>
          </div>
        ) : null}

        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
          <li>{copy.invites}</li>
          <li>{copy.roles}</li>
        </ul>

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button variant="destructive" disabled={disable.isPending} onClick={() => void submit()}>
            {disable.isPending ? copy.working : copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
