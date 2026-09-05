"use client";

import { useRef } from "react";
import { FileText, Image as ImageIcon, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PICKER_ACCEPT, formatFileSize, isImage } from "@/lib/attachments/rules";
import type { AttachmentUploads } from "@/lib/attachments/use-attachment-uploads";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * The picker and the files it is still sending, or holding until the Request
 * exists. The state lives in `useAttachmentUploads` so a dialog can keep it
 * across its own steps; this only draws it.
 */
export function AttachmentUploader({
  uploads,
  disabled = false,
}: {
  uploads: AttachmentUploads;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const inactive = disabled || uploads.full;

  return (
    <div className="space-y-2">
      {uploads.jobs.length > 0 ? (
        <ul className="space-y-2">
          {uploads.jobs.map((job) => {
            const Icon = isImage(job.contentType) ? ImageIcon : FileText;
            const percent = Math.round(job.progress * 100);
            const removable = job.queued || job.error !== undefined;
            return (
              <li key={job.key} className="flex items-start gap-2 text-sm">
                <Icon className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{job.fileName}</span>
                  <div className="text-muted-foreground text-xs">
                    {formatFileSize(job.size, t.common.dateLocale)}
                  </div>
                  {job.error ? (
                    <div className="text-destructive text-xs">{job.error}</div>
                  ) : job.queued ? null : (
                    <div className="mt-1 space-y-1">
                      <div
                        role="progressbar"
                        aria-label={job.fileName}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percent}
                        className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
                      >
                        <div className="bg-primary h-full" style={{ width: `${percent}%` }} />
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {percent < 100
                          ? t.attachments.uploading(percent)
                          : t.attachments.processing}
                      </div>
                    </div>
                  )}
                </div>
                {removable ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    aria-label={
                      job.error ? t.attachments.dismiss : t.attachments.remove(job.fileName)
                    }
                    onClick={() => uploads.remove(job.key)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="space-y-1">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={PICKER_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          disabled={inactive}
          aria-label={t.attachments.addFiles}
          onChange={(event) => {
            uploads.pick(event.target.files);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={inactive}
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
          {t.attachments.addFiles}
        </Button>
        <p className="text-muted-foreground text-xs">
          {uploads.full ? t.attachments.limitReached : t.attachments.addFilesHint}
        </p>
        <p className="text-muted-foreground text-xs">{t.attachments.visibilityNotice}</p>
      </div>
    </div>
  );
}
