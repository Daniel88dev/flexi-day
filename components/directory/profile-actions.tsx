"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EraseDialog } from "@/components/organization/erase-dialog";
import { PersonExportAction } from "@/components/person-export-action";
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
import type { DirectoryProfile, EndPreview } from "@/lib/api/directory";
import {
  useEndEmployment,
  useEndPreview,
  useRequestPersonExport,
  useRequestedExports,
} from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";

/** End employment, Export and Erase in the profile header, each only when `actions` allows it. */
export function ProfileActions({ profile }: { profile: DirectoryProfile }) {
  const actions = profile.actions;
  if (!actions || (!actions.end && !actions.export && !actions.erase)) return null;
  return (
    <>
      {actions.end ? <EndAction profile={profile} /> : null}
      {actions.export ? <ExportAction profile={profile} /> : null}
      {actions.erase ? <EraseAction profile={profile} /> : null}
    </>
  );
}

const isExternal = (profile: DirectoryProfile) => profile.markers.includes("EXTERNAL_WORKER");

function EndAction({ profile }: { profile: DirectoryProfile }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="text-destructive"
        onClick={() => setOpen(true)}
      >
        {isExternal(profile) ? t.directory.end.actionExternal : t.directory.end.action}
      </Button>
      <EndDialog open={open} onOpenChange={setOpen} profile={profile} />
    </>
  );
}

function EndDialog({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: DirectoryProfile;
}) {
  const { t } = useTranslation();
  const copy = t.directory.end;
  const external = isExternal(profile);
  const preview = useEndPreview(profile.organizationId, profile.employmentId, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {external ? copy.titleExternal(profile.name) : copy.title(profile.name)}
          </DialogTitle>
          {!preview.data ? (
            <DialogDescription>{preview.error ? copy.loadFailed : copy.loading}</DialogDescription>
          ) : null}
        </DialogHeader>
        {preview.data ? (
          <EndForm
            key={preview.data.suggestedEndedOn}
            preview={preview.data}
            profile={profile}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EndForm({
  preview,
  profile,
  onDone,
}: {
  preview: EndPreview;
  profile: DirectoryProfile;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const copy = t.directory.end;
  const external = isExternal(profile);
  const end = useEndEmployment(profile.organizationId);
  const [endedOn, setEndedOn] = useState(preview.suggestedEndedOn);
  const [error, setError] = useState<string | null>(null);
  const blocked = preview.managedGroups.length > 0;
  const roleNames = t.directory.profile.directoryRoleNames;

  const effects = [
    preview.groups.length > 0
      ? copy.leavesGroups(preview.groups.map((group) => group.name).join(", "))
      : null,
    preview.cancelledBookings > 0 ? copy.cancelsBookings(preview.cancelledBookings) : null,
    preview.organizationAdmin ? copy.dropsAdmin : null,
    preview.directoryRoles.length > 0
      ? copy.endsRoles(preview.directoryRoles.map((role) => roleNames[role]).join(", "))
      : null,
    preview.atEndSections && preview.atEndSections.length > 0
      ? copy.clearsAtEnd(
          preview.atEndSections.map((section) => t.directory.history.sections[section]).join(", ")
        )
      : null,
  ].filter((line): line is string => line !== null);

  async function submit() {
    setError(null);
    if (endedOn > preview.today) {
      setError(copy.futureDate);
      return;
    }
    if (endedOn < preview.startedOn) {
      setError(copy.beforeStart);
      return;
    }
    try {
      await end.mutateAsync({ employmentId: profile.employmentId, endedOn });
      pushToast(external ? copy.doneExternal(profile.name) : copy.done(profile.name));
      onDone();
    } catch (err) {
      setError(
        errorCopy(
          err,
          {
            MANAGES_GROUP: copy.managesGroups(
              preview.managedGroups.map((group) => group.name).join(", ")
            ),
            END_DATE_IN_FUTURE: copy.futureDate,
            END_DATE_BEFORE_START: copy.beforeStart,
            OWNER_EMPLOYMENT: copy.ownerEmployment,
          },
          copy.failed
        )
      );
    }
  }

  return (
    <>
      <div className="space-y-4 text-sm">
        {blocked ? (
          <p className="text-destructive">
            {copy.managesGroups(preview.managedGroups.map((group) => group.name).join(", "))}
          </p>
        ) : null}
        {preview.reportees.length > 0 ? (
          <div className="space-y-1">
            <p id="end-reportees">{copy.reportees}</p>
            <ul aria-labelledby="end-reportees" className="list-disc pl-5">
              {preview.reportees.map((person) => (
                <li key={person.employmentId}>{person.name}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {effects.length > 0 ? (
          <div className="space-y-1">
            <p id="end-effects">{copy.effects}</p>
            <ul aria-labelledby="end-effects" className="list-disc pl-5">
              {effects.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor={`end-${profile.employmentId}`}>{copy.dateLabel}</Label>
          <Input
            id={`end-${profile.employmentId}`}
            type="date"
            min={preview.startedOn}
            max={preview.today}
            value={endedOn}
            onChange={(event) => {
              setEndedOn(event.target.value);
              setError(null);
            }}
          />
          {error ? <p className="text-destructive">{error}</p> : null}
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          {t.common.cancel}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={blocked || end.isPending || endedOn === ""}
          onClick={() => void submit()}
        >
          {external ? copy.confirmExternal : copy.confirm}
        </Button>
      </DialogFooter>
    </>
  );
}

function ExportAction({ profile }: { profile: DirectoryProfile }) {
  const { t } = useTranslation();
  const exports = useRequestedExports(profile.organizationId).data;
  const request = useRequestPersonExport();
  const entry = exports?.find(
    (row) =>
      row.subjectEmploymentId === profile.employmentId ||
      (row.subjectUserId !== null && row.subjectUserId === profile.user.id)
  );
  return (
    <PersonExportAction
      entry={entry}
      labels={{
        export: t.common.personExport.exportFor(profile.name),
        download: t.common.personExport.downloadFor(profile.name),
      }}
      requesting={request.isPending && request.variables === profile.employmentId}
      onRequest={() => request.mutateAsync(profile.employmentId)}
    />
  );
}

function EraseAction({ profile }: { profile: DirectoryProfile }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="text-destructive"
        aria-label={t.organization.people.eraseFor(profile.name)}
        onClick={() => setOpen(true)}
      >
        {t.organization.people.erase}
      </Button>
      <EraseDialog
        open={open}
        onOpenChange={setOpen}
        employment={{ id: profile.employmentId, ended: profile.ended, user: profile.user }}
        organizationId={profile.organizationId}
        onErased={() =>
          router.push(`/directory?organizationId=${encodeURIComponent(profile.organizationId)}`)
        }
      />
    </>
  );
}
