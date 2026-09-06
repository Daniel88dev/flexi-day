"use client";

import { useId, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PICKER_ACCEPT, formatFileSize } from "@/lib/attachments/rules";
import type { AttachmentUploads } from "@/lib/attachments/use-attachment-uploads";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";
import { AttachmentRow } from "./attachment-row";

/**
 * The files being picked or sent, and the field that takes more. The state
 * lives in `useAttachmentUploads` so a dialog can keep it across its own
 * steps; this only draws it.
 */
export function AttachmentUploader({
  uploads,
  disabled = false,
  notice = true,
}: {
  uploads: AttachmentUploads;
  disabled?: boolean;
  /** Whether to say who gets to see the files; off where the reader already knows. */
  notice?: boolean;
}) {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);
  const hintId = useId();
  const inactive = disabled || uploads.full;

  return (
    <div className="space-y-3">
      {uploads.jobs.length > 0 ? (
        <ul className="space-y-2">
          {uploads.jobs.map((job) => {
            const removable = job.queued || job.error !== undefined;
            const sending = !job.queued && job.error === undefined;
            const percent = Math.round(job.progress * 100);
            return (
              <AttachmentRow
                key={job.key}
                contentType={job.contentType}
                name={job.fileName}
                meta={
                  sending
                    ? percent < 100
                      ? t.attachments.uploading(percent)
                      : t.attachments.processing
                    : formatFileSize(job.size, t.common.dateLocale)
                }
                note={job.error ? <span role="alert">{job.error}</span> : undefined}
                noteTone={job.error ? "destructive" : "muted"}
                progress={sending ? job.progress : undefined}
                progressLabel={job.fileName}
                actions={
                  removable ? (
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={
                        job.error ? t.attachments.dismiss : t.attachments.remove(job.fileName)
                      }
                      onClick={() => uploads.remove(job.key)}
                    >
                      <X />
                    </Button>
                  ) : null
                }
              />
            );
          })}
        </ul>
      ) : null}

      <div className="space-y-1.5">
        {/* The real file input is laid over the whole zone at opacity 0, so a
            click lands on the input itself. No scripted .click() and no label
            proxy, which is what some browsers refuse inside a modal. Native
            drop on the input fires change too, the same path as a pick. */}
        <div
          data-dragging={dragging || undefined}
          data-inactive={inactive || undefined}
          className={cn(
            "border-input bg-input/30 text-muted-foreground relative flex w-full items-center gap-3 rounded-xl border border-dashed px-3 py-2.5 text-left transition-colors",
            "hover:bg-input/50 hover:text-foreground has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-ring/50 has-[input:focus-visible]:ring-[3px]",
            "data-dragging:border-ring data-dragging:bg-accent data-dragging:text-foreground",
            "data-inactive:hover:bg-input/30 data-inactive:opacity-60"
          )}
          onDragEnter={() => {
            if (!inactive) setDragging(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false);
          }}
          onDrop={() => setDragging(false)}
        >
          <input
            type="file"
            multiple
            accept={PICKER_ACCEPT}
            disabled={inactive}
            aria-label={t.attachments.addFiles}
            aria-describedby={hintId}
            className={cn(
              "absolute inset-0 z-10 size-full cursor-pointer opacity-0",
              "disabled:cursor-not-allowed"
            )}
            onChange={(event) => {
              uploads.pick(event.target.files);
              event.target.value = "";
            }}
          />
          <span className="bg-muted grid size-9 shrink-0 place-items-center rounded-xl">
            <Paperclip className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="text-foreground block text-sm font-medium">
              {uploads.full ? t.attachments.limitReached : t.attachments.addFiles}
            </span>
            <span id={hintId} aria-hidden className="block text-xs">
              {uploads.full ? t.attachments.limitReachedHint : t.attachments.addFilesHint}
            </span>
          </span>
        </div>
        {notice ? (
          <p className="text-muted-foreground text-xs">{t.attachments.visibilityNotice}</p>
        ) : null}
      </div>
    </div>
  );
}
