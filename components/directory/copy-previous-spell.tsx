"use client";

import { useState } from "react";
import { History } from "lucide-react";
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
import {
  COPYABLE_SECTIONS,
  type CopyableSection,
  type CopyableSectionKey,
  type DirectoryOrganization,
  type DirectoryProfile,
} from "@/lib/api/directory";
import {
  useCopyFromPreviousSpell,
  useOrganizationTimeZone,
  usePreviousSpell,
} from "@/lib/api/queries";
import { formatDay, formatEmploymentDay } from "@/lib/directory/format";
import { useTranslation } from "@/lib/i18n/use-translation";

/** On a rejoined profile, for the owner, org admins and HR, while something can be copied. */
export function CopyPreviousSpellBanner({
  profile,
  organization,
}: {
  profile: DirectoryProfile;
  organization?: DirectoryOrganization;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  if (!profile.actions?.copyFromPreviousSpell) return null;
  const copy = t.directory.copySpell;
  const lapsed = organization ? !organization.writable : false;
  return (
    <div
      role="status"
      data-testid="copy-previous-spell"
      className="border-primary/30 bg-primary/5 flex flex-wrap items-center gap-3 rounded-[var(--radius)] border px-4 py-3"
    >
      <History className="text-primary h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{copy.bannerTitle}</p>
        <p className="text-muted-foreground text-xs">{copy.bannerBody(profile.name)}</p>
      </div>
      {lapsed ? <span className="text-muted-foreground text-xs">{copy.lapsed}</span> : null}
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={lapsed}
        onClick={() => setOpen(true)}
      >
        {copy.action}
      </Button>
      {open ? <CopyDialog profile={profile} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}

function CopyDialog({ profile, onClose }: { profile: DirectoryProfile; onClose: () => void }) {
  const { t } = useTranslation();
  const copy = t.directory.copySpell;
  const previous = usePreviousSpell(profile.organizationId, profile.employmentId, true);
  const copyFrom = useCopyFromPreviousSpell(profile.organizationId, profile.employmentId);
  const [chosen, setChosen] = useState<CopyableSectionKey[]>([]);
  const [error, setError] = useState<string | null>(null);
  const timeZone = useOrganizationTimeZone(profile.organizationId);
  const date = (value: string) => formatEmploymentDay(value, t.common.dateLocale, timeZone);

  const statusLine = (section: CopyableSection) =>
    section.status === "REMOVED_ON"
      ? copy.status.REMOVED_ON(formatDay(section.date, t.common.dateLocale))
      : section.status === "COPYABLE"
        ? null
        : copy.status[section.status];

  const toggle = (key: CopyableSectionKey, on: boolean) =>
    setChosen((current) => (on ? [...current, key] : current.filter((entry) => entry !== key)));

  async function submit() {
    setError(null);
    try {
      await copyFrom.mutateAsync(COPYABLE_SECTIONS.filter((key) => chosen.includes(key)));
      pushToast(copy.done(profile.name));
      onClose();
    } catch (err) {
      setError(errorCopy(err, copy.errors, copy.errors.failed));
    }
  }

  return (
    <Dialog open onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title(profile.name)}</DialogTitle>
          <DialogDescription>
            {previous.data
              ? copy.description(
                  date(previous.data.previous.startedAt),
                  date(previous.data.previous.endedAt)
                )
              : previous.error
                ? copy.loadFailed
                : copy.loading}
          </DialogDescription>
        </DialogHeader>
        {previous.data ? (
          <ul className="space-y-3">
            {COPYABLE_SECTIONS.map((key) => {
              const section = previous.data.sections[key];
              if (!section) return null;
              const id = `copy-section-${key}`;
              const line = statusLine(section);
              return (
                <li key={key} className="flex items-start gap-3">
                  <Checkbox
                    id={id}
                    className="mt-0.5"
                    checked={chosen.includes(key)}
                    disabled={section.status !== "COPYABLE" || copyFrom.isPending}
                    onCheckedChange={(checked) => toggle(key, checked === true)}
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor={id}>{copy.sections[key]}</Label>
                    {line ? <p className="text-muted-foreground text-xs">{line}</p> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {copy.cancel}
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={chosen.length === 0 || copyFrom.isPending}
          >
            {copyFrom.isPending ? copy.copying : copy.copy}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
