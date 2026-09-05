"use client";

import { useRef, useState } from "react";
import { FileText, Image as ImageIcon, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { UploadError } from "@/lib/api/attachment-upload";
import { useUploadAttachment } from "@/lib/api/queries";
import type { Attachment } from "@/lib/api/types";
import {
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_REQUEST,
  PICKER_ACCEPT,
  attachmentSlotsUsed,
  declaredContentType,
  formatFileSize,
  isAcceptedContentType,
  isImage,
} from "@/lib/attachments/rules";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Dictionary } from "@/lib/i18n";

type Job = {
  key: number;
  fileName: string;
  contentType: string;
  size: number;
  progress: number;
  /** Set once the backend has the row; the detail's own list takes over from there. */
  attachmentId?: string;
  error?: string;
};

type CreateFailure = { reason?: "UNSUPPORTED_TYPE" | "FILE_TOO_LARGE" | "ATTACHMENT_LIMIT" };

function uploadErrorMessage(error: unknown, t: Dictionary): string {
  if (error instanceof ApiError) {
    if (error.status === 402) return t.attachments.paidPlanOnly;
    const reason = error.context<CreateFailure>()?.reason;
    if (reason === "UNSUPPORTED_TYPE") return t.attachments.unsupportedType;
    if (reason === "FILE_TOO_LARGE") return t.attachments.tooLarge;
    if (reason === "ATTACHMENT_LIMIT") return t.attachments.limitReached;
    return error.message;
  }
  if (error instanceof UploadError) return t.attachments.uploadFailed;
  return error instanceof Error && error.message ? error.message : t.attachments.uploadFailed;
}

/**
 * The picker and the files it is still sending. Each file is checked here
 * first, so an obviously wrong pick is explained without a round trip; the
 * backend repeats the checks and is the authority. Once a file has landed the
 * row shows up in `attachments` and its local entry steps aside.
 */
export function AttachmentUploader({
  requestId,
  attachments,
  disabled = false,
  onTransportFailure,
}: {
  requestId: string;
  /** The Request's live rows, as the detail last reported them. */
  attachments: Attachment[];
  disabled?: boolean;
  /** A row was registered but its bytes never arrived; the caller shows it as failed. */
  onTransportFailure?: (attachmentId: string) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const nextKey = useRef(0);
  const upload = useUploadAttachment();
  const [jobs, setJobs] = useState<Job[]>([]);

  const landed = (job: Job) =>
    job.attachmentId !== undefined && attachments.some((a) => a.id === job.attachmentId);
  const visibleJobs = jobs.filter((job) => !landed(job));
  const inFlight = visibleJobs.filter((job) => !job.error).length;
  const remaining = MAX_ATTACHMENTS_PER_REQUEST - attachmentSlotsUsed(attachments) - inFlight;
  const full = remaining <= 0;
  const inactive = disabled || full;

  function patch(key: number, change: Partial<Job>) {
    setJobs((current) => current.map((job) => (job.key === key ? { ...job, ...change } : job)));
  }

  function start(file: File, key: number) {
    upload
      .mutateAsync({
        requestId,
        file,
        onProgress: (fraction) => patch(key, { progress: fraction }),
      })
      .then((attachment) => patch(key, { attachmentId: attachment.id, progress: 1 }))
      .catch((error: unknown) => {
        // The row exists but its bytes never arrived: let the list own it as
        // failed rather than showing "checking" beside a local error.
        if (error instanceof UploadError && error.attachmentId) {
          onTransportFailure?.(error.attachmentId);
          patch(key, { attachmentId: error.attachmentId });
          return;
        }
        patch(key, { error: uploadErrorMessage(error, t) });
      });
  }

  function pick(files: FileList | null) {
    if (!files || files.length === 0) return;
    const added: Job[] = [];
    let open = remaining;
    for (const file of Array.from(files)) {
      const contentType = declaredContentType(file);
      const job: Job = {
        key: nextKey.current++,
        fileName: file.name,
        contentType,
        size: file.size,
        progress: 0,
      };
      if (open <= 0) job.error = t.attachments.limitReached;
      else if (!isAcceptedContentType(contentType)) job.error = t.attachments.unsupportedType;
      else if (file.size > MAX_ATTACHMENT_BYTES) job.error = t.attachments.tooLarge;
      added.push(job);
      if (!job.error) {
        open -= 1;
        start(file, job.key);
      }
    }
    setJobs((current) => [...current, ...added]);
  }

  return (
    <div className="space-y-2">
      {visibleJobs.length > 0 ? (
        <ul className="space-y-2">
          {visibleJobs.map((job) => {
            const Icon = isImage(job.contentType) ? ImageIcon : FileText;
            const percent = Math.round(job.progress * 100);
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
                  ) : (
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
                {job.error ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    aria-label={t.attachments.dismiss}
                    onClick={() => setJobs((current) => current.filter((j) => j.key !== job.key))}
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
            pick(event.target.files);
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
          {full ? t.attachments.limitReached : t.attachments.addFilesHint}
        </p>
        <p className="text-muted-foreground text-xs">{t.attachments.visibilityNotice}</p>
      </div>
    </div>
  );
}
