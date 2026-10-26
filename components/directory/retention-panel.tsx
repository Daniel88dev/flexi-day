"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RETENTION_PERIODS,
  type ProfileHistorySection,
  type RetentionPeriod,
  type RetentionSettings,
} from "@/lib/api/directory";
import {
  useRetentionPreview,
  useRetentionSettings,
  useUpdateRetentionPeriod,
} from "@/lib/api/queries";
import { isShortening } from "@/lib/directory/retention";
import { useTranslation } from "@/lib/i18n/use-translation";

const SECTIONS: ProfileHistorySection[] = [
  "CARD",
  "PHOTO",
  "WORK_CONTACT",
  "JOB",
  "CONTACT",
  "PERSONAL",
];

type Change = { section: ProfileHistorySection; period: RetentionPeriod };

/** The Retention panel: the owner and org admins set a period per Section, HR reads them. */
export function RetentionPanel({ organizationId }: { organizationId: string }) {
  const { t } = useTranslation();
  const copy = t.directory.settings.retentionPanel;
  const settings = useRetentionSettings(organizationId, true);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.intro}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {settings.error ? (
          <p className="text-destructive text-sm">{copy.loadFailed}</p>
        ) : !settings.data ? (
          <p className="text-muted-foreground text-sm">{t.common.loading}</p>
        ) : (
          <Periods organizationId={organizationId} settings={settings.data} />
        )}
      </CardContent>
    </Card>
  );
}

function Periods({
  organizationId,
  settings,
}: {
  organizationId: string;
  settings: RetentionSettings;
}) {
  const { t } = useTranslation();
  const copy = t.directory.settings.retentionPanel;
  const sectionNames = t.directory.history.sections;
  const update = useUpdateRetentionPeriod(organizationId);
  const [shortening, setShortening] = useState<Change | null>(null);

  const choose = (change: Change) => {
    if (isShortening(settings.periods[change.section], change.period)) {
      setShortening(change);
      return;
    }
    update.mutate(change);
  };

  return (
    <>
      {!settings.editable ? <p className="text-muted-foreground text-sm">{copy.readOnly}</p> : null}
      {update.error ? (
        <p role="alert" className="text-destructive text-sm">
          {copy.saveFailed}
        </p>
      ) : null}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-muted-foreground text-xs uppercase">
            <th scope="col" className="py-2 text-left font-medium">
              {copy.section}
            </th>
            <th scope="col" className="py-2 text-left font-medium">
              {copy.period}
            </th>
          </tr>
        </thead>
        <tbody>
          {SECTIONS.map((section) => (
            <tr key={section} className="border-t">
              <th scope="row" className="py-2 pr-4 text-left font-semibold">
                {sectionNames[section]}
              </th>
              <td className="py-2">
                <div className="flex flex-wrap items-center gap-3">
                  {settings.editable ? (
                    <select
                      aria-label={copy.periodLabel(sectionNames[section])}
                      value={settings.periods[section]}
                      disabled={update.isPending}
                      onChange={(event) =>
                        choose({ section, period: event.target.value as RetentionPeriod })
                      }
                      className="border-border bg-background h-8 min-w-[9rem] rounded-md border px-2 text-sm disabled:opacity-50"
                    >
                      {RETENTION_PERIODS.map((period) => (
                        <option key={period} value={period}>
                          {copy.periods[period]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span>{copy.periods[settings.periods[section]]}</span>
                  )}
                  <span className="text-muted-foreground text-xs">
                    {copy.defaultIs(copy.periods[settings.defaults[section]])}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ShorteningDialog
        organizationId={organizationId}
        change={shortening}
        onCancel={() => setShortening(null)}
        onConfirm={(change) => {
          update.mutate(change);
          setShortening(null);
        }}
      />
    </>
  );
}

function ShorteningDialog({
  organizationId,
  change,
  onCancel,
  onConfirm,
}: {
  organizationId: string;
  change: Change | null;
  onCancel: () => void;
  onConfirm: (change: Change) => void;
}) {
  const { t } = useTranslation();
  const copy = t.directory.settings.retentionPanel;
  const preview = useRetentionPreview(organizationId, change);
  const section = change ? t.directory.history.sections[change.section] : "";

  return (
    <Dialog open={change !== null} onOpenChange={(open) => (open ? null : onCancel())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.confirmTitle(section)}</DialogTitle>
          <DialogDescription>
            {preview.error
              ? copy.countFailed
              : preview.data
                ? copy.removes(section, preview.data.affected)
                : copy.counting}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t.common.cancel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!preview.data || change === null}
            onClick={() => (change ? onConfirm(change) : null)}
          >
            {copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
