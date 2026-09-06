"use client";

import { useState } from "react";
import { Download, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAttachmentDownloadUrl } from "@/lib/api/attachments";
import { ApiError } from "@/lib/api/client";
import type { Attachment, AttachmentDisposition, UserSummary } from "@/lib/api/types";
import {
  attachmentDisplayStatus,
  formatFileSize,
  isFailedUpload,
  isImage,
  type AttachmentDisplayStatus,
} from "@/lib/attachments/rules";
import { AttachmentRow } from "./attachment-row";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Dictionary } from "@/lib/i18n";
import { resolveActor } from "@/lib/vacations/timeline";
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

type RowJob = { id: string; action: "url" | "delete" };

/** A row already gone is not an error: the refetch takes it off the list. */
function deleteErrorMessage(error: unknown, t: Dictionary): string | null {
  if (error instanceof ApiError && error.status === 403) return t.attachments.deleteForbidden;
  if (error instanceof ApiError && (error.status === 404 || error.status === 409)) return null;
  return t.attachments.deleteFailed;
}

/**
 * The files on a Request. Every open, preview or download asks the backend for
 * a fresh short-lived URL at that moment; nothing in the DOM links to a file.
 */
export function AttachmentList({
  attachments,
  people,
  failedIds = [],
  canDelete,
  onDelete,
}: {
  attachments: Attachment[];
  /** Whoever the detail already names; an uploader not among them is an admin. */
  people: UserSummary[];
  /** Rows this session registered whose bytes never arrived; shown as failed at once. */
  failedIds?: string[];
  canDelete?: (attachment: Attachment) => boolean;
  /** Runs after the user confirms; the row leaves once the detail is refetched. */
  onDelete?: (attachment: Attachment) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<{ fileName: string; url: string } | null>(null);
  const [busy, setBusy] = useState<RowJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runRowJob(
    job: RowJob,
    work: () => Promise<void>,
    failure: (error: unknown) => string | null
  ) {
    setError(null);
    setBusy(job);
    try {
      await work();
    } catch (error) {
      setError(failure(error));
    } finally {
      setBusy(null);
    }
  }

  function withUrl(
    attachment: Attachment,
    disposition: AttachmentDisposition,
    consume: (url: string) => void,
    onFailure?: () => void
  ) {
    return runRowJob(
      { id: attachment.id, action: "url" },
      async () => {
        const { url } = await getAttachmentDownloadUrl(attachment.id, disposition);
        consume(url);
      },
      () => {
        onFailure?.();
        return t.attachments.openFailed;
      }
    );
  }

  function remove(attachment: Attachment) {
    if (!onDelete || !window.confirm(t.attachments.deleteConfirm(attachment.fileName))) return;
    void runRowJob(
      { id: attachment.id, action: "delete" },
      async () => {
        await onDelete(attachment);
      },
      (error) => deleteErrorMessage(error, t)
    );
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
    void withUrl(
      attachment,
      "inline",
      (url) => {
        if (tab) tab.location.href = url;
        else setError(t.attachments.openFailed);
      },
      () => tab?.close()
    );
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
    const actor = resolveActor(people, attachment.uploadedByUserId);
    if (actor.kind === "named") return t.attachments.uploadedBy(actor.user.name);
    return actor.kind === "gone"
      ? t.attachments.uploadedByRemovedAccount
      : t.attachments.uploadedByAdmin;
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
          const status = isFailedUpload(attachment, failedIds)
            ? "failed"
            : attachmentDisplayStatus(attachment);
          const ready = status === "ready";
          const rowBusy = busy?.id === attachment.id;
          const spinning = (action: RowJob["action"]) => rowBusy && busy.action === action;
          const note = statusLabel(attachment, status);
          return (
            <AttachmentRow
              key={attachment.id}
              contentType={attachment.contentType}
              name={
                ready ? (
                  <button
                    type="button"
                    className="max-w-full truncate text-left underline-offset-2 hover:underline"
                    aria-label={
                      isImage(attachment.contentType)
                        ? t.attachments.preview(attachment.fileName)
                        : t.attachments.open(attachment.fileName)
                    }
                    disabled={rowBusy}
                    onClick={() => open(attachment)}
                  >
                    {attachment.fileName}
                  </button>
                ) : (
                  attachment.fileName
                )
              }
              meta={
                <>
                  {formatFileSize(attachment.size, t.common.dateLocale)} ·{" "}
                  {uploaderLabel(attachment)} ·{" "}
                  {formatMoment(attachment.createdAt, t.common.dateLocale)}
                </>
              }
              note={note ? <span role="status">{note}</span> : undefined}
              noteTone={status === "rejected" || status === "failed" ? "destructive" : "muted"}
              actions={
                <>
                  {ready ? (
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={t.attachments.download(attachment.fileName)}
                      disabled={rowBusy}
                      onClick={() => download(attachment)}
                    >
                      {spinning("url") ? <Loader2 className="animate-spin" /> : <Download />}
                    </Button>
                  ) : null}
                  {canDelete?.(attachment) ? (
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={t.attachments.delete(attachment.fileName)}
                      disabled={rowBusy}
                      onClick={() => remove(attachment)}
                    >
                      {spinning("delete") ? <Loader2 className="animate-spin" /> : <Trash2 />}
                    </Button>
                  ) : null}
                </>
              }
            />
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
