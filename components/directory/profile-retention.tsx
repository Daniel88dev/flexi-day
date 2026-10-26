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
import {
  PROFILE_SECTION_KEYS,
  type DirectoryProfile,
  type ProfileHistorySection,
  type ProfileSectionKey,
  type SectionRetention,
} from "@/lib/api/directory";
import { useSetRetentionHold } from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";

const HISTORY_SECTION: Record<ProfileSectionKey, ProfileHistorySection> = {
  card: "CARD",
  photo: "PHOTO",
  workContact: "WORK_CONTACT",
  job: "JOB",
  contact: "CONTACT",
  personal: "PERSONAL",
};

/** Formats a `YYYY-MM-DD` date as the calendar day it names, whatever the viewer's zone. */
export const formatDay = (value: string, locale: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString(locale, { timeZone: "UTC" });

/** The label of a Section, as the profile history names it. */
export const useSectionLabel = () => {
  const { t } = useTranslation();
  return (key: ProfileSectionKey) => t.directory.history.sections[HISTORY_SECTION[key]];
};

/** The Retention hold and when each Section goes or went, on an ended profile. */
export function ProfileRetention({ profile }: { profile: DirectoryProfile }) {
  const { t } = useTranslation();
  const copy = t.directory.retention;
  const sectionLabel = useSectionLabel();
  const retention = profile.retention;
  if (!retention) return null;
  const status = (entry: SectionRetention) =>
    entry.status === "REMOVES_ON" || entry.status === "REMOVED_ON"
      ? copy.status[entry.status](formatDay(entry.date, t.common.dateLocale))
      : copy.status[entry.status];
  const lines = PROFILE_SECTION_KEYS.flatMap((key) => {
    const entry = retention.sections[key];
    return entry ? [{ key, text: status(entry) }] : [];
  });
  const hold = retention.hold;

  return (
    <div className="space-y-3 text-sm">
      {lines.length > 0 ? (
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[max-content_1fr]">
          {lines.map((line) => (
            <div key={line.key} className="contents">
              <dt className="text-muted-foreground">{sectionLabel(line.key)}</dt>
              <dd>{line.text}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-muted-foreground">
          {hold
            ? copy.holdOn(
                new Date(hold.setAt).toLocaleDateString(t.common.dateLocale),
                hold.setBy?.name ?? null
              )
            : copy.holdOff}
        </p>
        {profile.actions?.hold ? <HoldAction profile={profile} on={!!hold} /> : null}
      </div>
    </div>
  );
}

function HoldAction({ profile, on }: { profile: DirectoryProfile; on: boolean }) {
  const { t } = useTranslation();
  const copy = t.directory.retention;
  const hold = useSetRetentionHold(profile.organizationId, profile.employmentId);
  const [confirming, setConfirming] = useState(false);

  async function change(next: boolean) {
    try {
      await hold.mutateAsync(next);
      pushToast(next ? copy.holdSet : copy.holdLifted);
      setConfirming(false);
    } catch {
      pushToast(copy.holdFailed, "danger");
    }
  }

  if (!on) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={hold.isPending}
        onClick={() => void change(true)}
      >
        {copy.setHold}
      </Button>
    );
  }
  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setConfirming(true)}>
        {copy.liftHold}
      </Button>
      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.liftTitle(profile.name)}</DialogTitle>
            <DialogDescription>{copy.liftBody}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
              {t.common.cancel}
            </Button>
            <Button type="button" disabled={hold.isPending} onClick={() => void change(false)}>
              {copy.lift}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
