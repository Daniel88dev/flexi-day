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
import type { EmploymentListItem } from "@/lib/api/employment";
import { useEraseEmployment } from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";

/** The backend's rule too: case and extra spaces don't make a typed name wrong. */
const sameName = (typed: string, expected: string) => {
  const normalize = (value: string) =>
    value.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase();
  return normalize(typed) === normalize(expected);
};

export function EraseDialog({
  open,
  onOpenChange,
  employment,
  organizationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employment: EmploymentListItem;
  organizationId: string | null;
}) {
  const { t } = useTranslation();
  const copy = t.organization.people.eraseDialog;
  const erase = useEraseEmployment(organizationId);
  const name = employment.user.name;
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!sameName(typed, name)) {
      setError(copy.nameMismatch);
      return;
    }

    try {
      await erase.mutateAsync({ employmentId: employment.id, confirmName: typed });
      pushToast(copy.done(name));
      onOpenChange(false);
    } catch (err) {
      setError(
        errorCopy(
          err,
          { NAME_MISMATCH: copy.nameMismatch, MANAGES_GROUP: copy.managesGroup },
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
          <DialogTitle>{copy.title(name)}</DialogTitle>
          <DialogDescription>{copy.body}</DialogDescription>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">{copy.others}</p>
        {employment.ended ? null : <p className="text-sm">{copy.openFirst}</p>}
        <div className="space-y-2">
          <Label htmlFor={`erase-${employment.id}`}>{copy.nameLabel(name)}</Label>
          <Input
            id={`erase-${employment.id}`}
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
            disabled={erase.isPending || typed.trim() === ""}
            onClick={() => void submit()}
          >
            {copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
