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
import type { DirectoryProfile } from "@/lib/api/directory";
import { useChangeWorkerType } from "@/lib/api/queries";
import { isExternalWorker } from "@/lib/directory/person";
import { useTranslation } from "@/lib/i18n/use-translation";

/** Change worker type on the profile: employee to External worker and back. */
export function WorkerTypeAction({ profile }: { profile: DirectoryProfile }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        {t.directory.workerType.action}
      </Button>
      {open ? <WorkerTypeDialog profile={profile} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function WorkerTypeDialog({
  profile,
  onClose,
}: {
  profile: DirectoryProfile;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const copy = t.directory.workerType;
  const labels = t.directory.profile;
  const toExternal = !isExternalWorker(profile);
  const change = useChangeWorkerType(profile.organizationId, profile.employmentId);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    try {
      await change.mutateAsync(toExternal ? "external" : "employee");
      pushToast(toExternal ? copy.doneExternal(profile.name) : copy.doneEmployee(profile.name));
      onClose();
    } catch (err) {
      setError(errorCopy(err, copy.errors, copy.errors.failed));
    }
  }

  return (
    <Dialog open onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {toExternal ? copy.toExternalTitle(profile.name) : copy.toEmployeeTitle(profile.name)}
          </DialogTitle>
          <DialogDescription>
            {toExternal ? copy.externalEffects : copy.employeeEffects}
          </DialogDescription>
        </DialogHeader>
        {toExternal ? (
          <div className="space-y-1.5 text-sm">
            <p>{copy.clears}</p>
            <ul className="list-disc pl-5">
              {[
                labels.contractType,
                labels.workingTime,
                labels.probationEndDate,
                labels.personal,
              ].map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="button" onClick={submit} disabled={change.isPending}>
            {change.isPending ? copy.saving : toExternal ? copy.toExternal : copy.toEmployee}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
