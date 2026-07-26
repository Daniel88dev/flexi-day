"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReportFiltersBar } from "@/components/report/report-filters";
import { exportReport, saveBlob } from "@/lib/api/reports";
import { ApiError } from "@/lib/api/client";
import type { ReportFilters, ReportScope } from "@/lib/api/report-types";
import { useTranslation } from "@/lib/i18n/use-translation";

type Props = {
  scope: ReportScope | undefined;
  /** The report's live filters, used as the dialog's starting point. */
  filters: ReportFilters;
};

export function ExportDialog({ scope, filters }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ReportFilters>(filters);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-seed from the report on open: the user has usually just narrowed the
  // view and expects the export to match what they are looking at.
  function handleOpenChange(next: boolean) {
    if (next) {
      setDraft(filters);
      setError(null);
    }
    setOpen(next);
  }

  async function handleDownload() {
    setBusy(true);
    setError(null);
    try {
      const file = await exportReport(draft);
      saveBlob(file.blob, file.filename);
      setOpen(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 413) {
        setError(t.report.export.tooLarge);
      } else {
        setError(err instanceof Error ? err.message : t.report.export.failed);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4" />
          {t.report.export.button}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.report.export.title}</DialogTitle>
          <DialogDescription>{t.report.export.description}</DialogDescription>
        </DialogHeader>

        <ReportFiltersBar scope={scope} filters={draft} onChange={setDraft} />

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">{t.common.cancel}</Button>
          </DialogClose>
          <Button onClick={() => void handleDownload()} disabled={busy}>
            {busy ? t.report.export.preparing : t.report.export.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
