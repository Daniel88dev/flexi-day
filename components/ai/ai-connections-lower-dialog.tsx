"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
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
import { appLabel, type OrganizationAiConnection } from "@/lib/api/ai-connections";
import { useDisableAiConnections, useSetAiConnectionsLevel } from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * Confirms lowering AI connections to Read only or turning them off, naming
 * the apps it disconnects: the write grants when lowering, every grant when
 * turning off.
 */
export function AiConnectionsLowerDialog({
  target,
  onOpenChange,
  organizationId,
  grants,
}: {
  target: "read" | "off" | null;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  grants: OrganizationAiConnection[];
}) {
  const { t } = useTranslation();
  const setLevel = useSetAiConnectionsLevel(organizationId);
  const disable = useDisableAiConnections(organizationId);
  const [error, setError] = useState<string | null>(null);
  const copy = target === "off" ? t.aiConnectionsSettings.turnOff : t.aiConnectionsSettings.lower;
  const pending = setLevel.isPending || disable.isPending;
  const affected = target === "off" ? grants : grants.filter((grant) => grant.access === "write");
  const listCopy = t.aiConnectionGrants.ownerDialog;

  async function submit() {
    setError(null);
    try {
      if (target === "off") await disable.mutateAsync();
      else await setLevel.mutateAsync("read");
      pushToast(copy.done);
      onOpenChange(false);
    } catch (err) {
      setError(errorCopy(err, {}, copy.failed));
    }
  }

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(next) => {
        if (!next) setError(null);
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription className="text-foreground flex gap-2.5 rounded-lg bg-amber-500/10 px-3.5 py-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
            <span>{copy.warning}</span>
          </DialogDescription>
        </DialogHeader>
        {affected.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {target === "off" ? listCopy.offNone : listCopy.lowerNone}
          </p>
        ) : (
          <ul aria-label={listCopy.listLabel} className="divide-border divide-y text-sm">
            {affected.map((grant) => (
              <li key={grant.grantId} className="flex flex-wrap items-baseline gap-x-3 py-2">
                <span className="font-medium">{appLabel(grant.app)}</span>
                <span className="text-muted-foreground">{grant.personName}</span>
              </li>
            ))}
          </ul>
        )}
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.aiSettings.turnOn.cancel}
          </Button>
          <Button variant="destructive" disabled={pending} onClick={() => void submit()}>
            {pending ? copy.working : copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
