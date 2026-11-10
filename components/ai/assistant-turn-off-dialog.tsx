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
import { pushToast } from "@/components/toast";
import { errorCopy } from "@/lib/api/client";
import { useDisableAssistant } from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";

export function AssistantTurnOffDialog({
  open,
  onOpenChange,
  organizationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}) {
  const { t } = useTranslation();
  const copy = t.aiSettings.turnOff;
  const disable = useDisableAssistant(organizationId);
  const [error, setError] = useState<string | null>(null);

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
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.body}</DialogDescription>
        </DialogHeader>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {copy.keepOn}
          </Button>
          <Button variant="destructive" disabled={disable.isPending} onClick={() => void submit()}>
            {disable.isPending ? copy.working : copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
