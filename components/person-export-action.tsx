"use client";

import { useState } from "react";
import { Download, FileArchive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { errorCopy } from "@/lib/api/client";
import { pushToast } from "@/components/toast";
import {
  followDownloadLink,
  signPersonExportDownload,
  type PersonExport,
} from "@/lib/api/person-export";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * One Person export's control: Export, then Preparing while the ZIP is built,
 * then Download behind a freshly signed link. A failed or expired export
 * offers Export again.
 */
export function PersonExportAction({
  entry,
  labels,
  requesting,
  onRequest,
}: {
  entry: PersonExport | null | undefined;
  /** Accessible names that say whose data, or from where. */
  labels: { export: string; download: string };
  requesting: boolean;
  onRequest: () => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const copy = t.common.personExport;
  const [opening, setOpening] = useState(false);

  async function request() {
    try {
      await onRequest();
      pushToast(copy.requested);
    } catch (err) {
      pushToast(
        errorCopy(err, { EXPORT_UNAVAILABLE: copy.unavailable }, copy.requestFailed),
        "danger"
      );
    }
  }

  async function download(exportId: string) {
    setOpening(true);
    try {
      const { url } = await signPersonExportDownload(exportId);
      followDownloadLink(url);
    } catch (err) {
      pushToast(
        errorCopy(
          err,
          {
            EXPORT_EXPIRED: copy.expired,
            EXPORT_UNAVAILABLE: copy.unavailable,
            FORBIDDEN: copy.noAccess,
          },
          copy.downloadFailed
        ),
        "danger"
      );
    } finally {
      setOpening(false);
    }
  }

  if (entry?.status === "PENDING" || requesting) {
    return (
      <Button type="button" size="sm" variant="outline" disabled aria-label={labels.export}>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {copy.preparing}
      </Button>
    );
  }

  if (entry?.status === "READY") {
    return (
      <span className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={opening}
          aria-label={labels.download}
          onClick={() => void download(entry.id)}
        >
          <Download className="h-4 w-4" aria-hidden />
          {opening ? copy.opening : copy.download}
        </Button>
        {entry.expiresAt ? (
          <span className="text-muted-foreground text-xs">
            {copy.availableUntil(new Date(entry.expiresAt).toLocaleDateString(t.common.dateLocale))}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-label={labels.export}
        onClick={() => void request()}
      >
        <FileArchive className="h-4 w-4" aria-hidden />
        {copy.export}
      </Button>
      {entry?.status === "FAILED" ? (
        <span className="text-destructive text-xs">{copy.failed}</span>
      ) : null}
    </span>
  );
}
