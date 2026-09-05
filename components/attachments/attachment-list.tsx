"use client";

import { useState } from "react";
import { Download, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAttachmentDownloadUrl } from "@/lib/api/attachments";
import type { Attachment, AttachmentDisposition, UserSummary } from "@/lib/api/types";
import {
  attachmentDisplayStatus,
  formatFileSize,
  isImage,
  type AttachmentDisplayStatus,
} from "@/lib/attachments/rules";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";
import { AttachmentPreviewDialog } from "./attachment-preview-dialog";

function formatMoment(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_TONE: Record<AttachmentDisplayStatus, string> = {
  processing: "text-muted-foreground",
  ready: "text-muted-foreground",
  rejected: "text-destructive",
  failed: "text-destructive",
};

/**
 * The files on a Request. Every open, preview or download asks the backend for
 * a fresh short-lived URL at that moment; nothing in the DOM links to a file.
 */
export function AttachmentList({
  attachments,
  people,
  failedIds = [],
}: {
  attachments: Attachment[];
  /** Whoever the detail already names; an uploader not among them is an admin. */
  people: UserSummary[];
  /** Rows this session registered whose bytes never arrived; shown as failed at once. */
  failedIds?: string[];
}) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<{ fileName: string; url: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function withUrl(
    attachment: Attachment,
    disposition: AttachmentDisposition,
    consume: (url: string) => void
  ) {
    setError(null);
    setBusyId(attachment.id);
    try {
      const { url } = await getAttachmentDownloadUrl(attachment.id, disposition);
      consume(url);
    } catch {
      setError(t.attachments.openFailed);
    } finally {
      setBusyId(null);
    }
  }

  function open(attachment: Attachment) {
    if (isImage(attachment.contentType)) {
      void withUrl(attachment, "inline", (url) =>
        setPreview({ fileName: attachment.fileName, url })
      );
      return;
    }
    // The tab opens on the click itself, before the await, so popup blockers
    // treat it as user-initiated; it gets its address once the URL is here.
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    void withUrl(attachment, "inline", (url) => {
      if (tab) tab.location.href = url;
      else setError(t.attachments.openFailed);
    });
  }

  function download(attachment: Attachment) {
    void withUrl(attachment, "attachment", (url) => {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.rel = "noopener";
      anchor.click();
    });
  }

  function uploaderLabel(attachment: Attachment) {
    const person = people.find((p) => p.id === attachment.uploadedByUserId);
    return person ? t.attachments.uploadedBy(person.name) : t.attachments.uploadedByAdmin;
  }

  function statusLabel(attachment: Attachment, status: AttachmentDisplayStatus) {
    if (status === "processing") return t.attachments.processing;
    if (status === "failed") return t.attachments.failed;
    if (status === "rejected" && attachment.rejectionReason) {
      return t.attachments.rejected[attachment.rejectionReason];
    }
    return null;
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {attachments.map((attachment) => {
          const status = failedIds.includes(attachment.id)
            ? "failed"
            : attachmentDisplayStatus(attachment);
          const ready = status === "ready";
          const busy = busyId === attachment.id;
          const Icon = isImage(attachment.contentType) ? ImageIcon : FileText;
          const note = statusLabel(attachment, status);
          return (
            <li key={attachment.id} className="flex items-start gap-2 text-sm">
              <Icon className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                {ready ? (
                  <button
                    type="button"
                    className="max-w-full truncate text-left font-medium underline-offset-2 hover:underline"
                    aria-label={
                      isImage(attachment.contentType)
                        ? t.attachments.preview(attachment.fileName)
                        : t.attachments.open(attachment.fileName)
                    }
                    disabled={busy}
                    onClick={() => open(attachment)}
                  >
                    {attachment.fileName}
                  </button>
                ) : (
                  <span className="block truncate font-medium">{attachment.fileName}</span>
                )}
                <div className="text-muted-foreground text-xs">
                  {formatFileSize(attachment.size, t.common.dateLocale)} ·{" "}
                  {uploaderLabel(attachment)} ·{" "}
                  {formatMoment(attachment.createdAt, t.common.dateLocale)}
                </div>
                {note ? <div className={cn("text-xs", STATUS_TONE[status])}>{note}</div> : null}
              </div>
              {ready ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  aria-label={t.attachments.download(attachment.fileName)}
                  disabled={busy}
                  onClick={() => download(attachment)}
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
      {error ? (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
      <AttachmentPreviewDialog
        fileName={preview?.fileName ?? ""}
        url={preview?.url ?? null}
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      />
    </div>
  );
}
