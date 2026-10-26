"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pushToast } from "@/components/toast";
import { errorCopy } from "@/lib/api/client";
import { useDeleteAllDirectoryData } from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";
import { sameName } from "@/lib/same-name";

/** Delete all directory data, confirmed with the organization's name typed. */
export function DeleteDirectoryDataDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
}) {
  const { t } = useTranslation();
  const copy = t.organization.directory.deleteDialog;
  const deleteAll = useDeleteAllDirectoryData(organizationId);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!sameName(typed, organizationName)) {
      setError(copy.nameMismatch);
      return;
    }
    try {
      await deleteAll.mutateAsync(typed);
      pushToast(copy.done);
      onOpenChange(false);
    } catch (err) {
      setError(
        errorCopy(
          err,
          { NAME_MISMATCH: copy.nameMismatch, DIRECTORY_ON: copy.directoryOn },
          copy.failed
        )
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setTyped("");
          setError(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.body}</DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {copy.removes.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="text-muted-foreground text-sm">{copy.keeps}</p>
        <div className="space-y-2">
          <Label htmlFor="delete-directory-data-name">{copy.nameLabel(organizationName)}</Label>
          <Input
            id="delete-directory-data-name"
            autoComplete="off"
            value={typed}
            onChange={(event) => {
              setTyped(event.target.value);
              setError(null);
            }}
          />
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleteAll.isPending || typed.trim() === ""}
            onClick={() => void submit()}
          >
            {deleteAll.isPending ? copy.working : copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
