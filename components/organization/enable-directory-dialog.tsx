"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { pushToast } from "@/components/toast";
import { errorCopy } from "@/lib/api/client";
import type { DirectoryState } from "@/lib/api/directory";
import { useEnableDirectory } from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";
import { legalHref } from "@/lib/legal";

export function EnableDirectoryDialog({
  open,
  onOpenChange,
  state,
  organizationName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: DirectoryState;
  organizationName: string;
}) {
  const { t, locale } = useTranslation();
  const copy = t.organization.directory.dialog;
  const router = useRouter();
  const enable = useEnableDirectory(state.organizationId);
  const [accepted, setAccepted] = useState(false);
  const firstEnable = state.enabledAt === null;
  const [tellMembers, setTellMembers] = useState(firstEnable);
  const [error, setError] = useState<string | null>(null);
  const version = state.agreement.currentVersion;

  async function submit() {
    setError(null);
    try {
      await enable.mutateAsync({ agreementVersion: version, tellMembers });
      pushToast(copy.done);
      onOpenChange(false);
      router.push("/directory");
    } catch (err) {
      setError(
        errorCopy(
          err,
          {
            AGREEMENT_VERSION_STALE: copy.stale,
            DIRECTORY_ALREADY_ON: copy.alreadyOn,
            DIRECTORY_PLAN_REQUIRED: t.organization.directory.planRequired,
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
          setAccepted(false);
          setTellMembers(firstEnable);
          setError(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title(version)}</DialogTitle>
          <DialogDescription>
            {copy.summary(state.people.open)} {copy.keepsEmployment}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 space-y-2 rounded-[var(--radius-sm)] p-3 text-sm">
          <p>{copy.note}</p>
          <Link
            href={legalHref("directory-agreement", locale)}
            target="_blank"
            rel="noopener"
            className="text-primary font-semibold underline-offset-2 hover:underline"
          >
            {copy.readAgreement}
          </Link>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Checkbox
              id="acceptDirectoryAgreement"
              checked={accepted}
              onCheckedChange={(next) => setAccepted(next === true)}
            />
            <Label htmlFor="acceptDirectoryAgreement">{copy.accept(organizationName)}</Label>
          </div>
          <p className="text-muted-foreground text-xs">{copy.recordHint}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Checkbox
              id="tellDirectoryMembers"
              checked={tellMembers}
              onCheckedChange={(next) => setTellMembers(next === true)}
            />
            <Label htmlFor="tellDirectoryMembers">{copy.tellMembers}</Label>
          </div>
          <p className="text-muted-foreground text-xs">{copy.tellMembersHint}</p>
        </div>

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {copy.cancel}
          </Button>
          <Button disabled={!accepted || enable.isPending} onClick={() => void submit()}>
            {enable.isPending ? copy.working : copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
