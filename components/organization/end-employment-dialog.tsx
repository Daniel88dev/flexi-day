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
import { useEndEmployment } from "@/lib/api/queries";
import { businessDateIn } from "@/lib/attendance/self-service";
import { useTranslation } from "@/lib/i18n/use-translation";

export function EndEmploymentDialog({
  open,
  onOpenChange,
  employment,
  organizationId,
  timeZone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employment: EmploymentListItem;
  organizationId: string | null;
  timeZone: string;
}) {
  const { t } = useTranslation();
  const copy = t.organization.people.endDialog;
  const end = useEndEmployment(organizationId);
  const today = businessDateIn(new Date(), timeZone);
  const [endedOn, setEndedOn] = useState(today);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (endedOn > today) {
      setError(copy.futureDate);
      return;
    }

    try {
      await end.mutateAsync({ employmentId: employment.id, endedOn });
      pushToast(copy.done(employment.user.name));
      onOpenChange(false);
    } catch (err) {
      setError(
        errorCopy(
          err,
          {
            MANAGES_GROUP: copy.managesGroup,
            END_DATE_IN_FUTURE: copy.futureDate,
            END_DATE_BEFORE_START: copy.beforeStart,
          },
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
          setEndedOn(today);
          setError(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title(employment.user.name)}</DialogTitle>
          <DialogDescription>{copy.body}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor={`end-${employment.id}`}>{copy.dateLabel}</Label>
          <Input
            id={`end-${employment.id}`}
            type="date"
            max={today}
            value={endedOn}
            onChange={(event) => {
              setEndedOn(event.target.value);
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
            disabled={end.isPending || endedOn === ""}
            onClick={() => void submit()}
          >
            {copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
