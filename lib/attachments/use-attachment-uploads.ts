"use client";

import { useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { UploadError } from "@/lib/api/attachment-upload";
import { useUploadAttachment } from "@/lib/api/queries";
import type { Attachment } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Dictionary } from "@/lib/i18n";
import {
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_REQUEST,
  attachmentSlotsUsed,
  declaredContentType,
  isAcceptedContentType,
} from "./rules";

export type UploadJob = {
  key: number;
  fileName: string;
  contentType: string;
  size: number;
  /** Fraction of the bytes sent; stays 0 while the job waits. */
  progress: number;
  /** Picked before the Request existed; `start` sends it. */
  queued: boolean;
  /** Set once the backend has the row; the caller's list takes over from there. */
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

export type AttachmentUploads = ReturnType<typeof useAttachmentUploads>;

/**
 * The files being sent to one Request. On the detail the Request exists, so
 * a pick uploads at once; in the new-request dialog it does not yet, so picks
 * wait and `start` sends them once the id is known. Every file is checked
 * here first, so an obviously wrong pick is explained without a round trip;
 * the backend repeats the checks and is the authority. Once a file has landed
 * its row shows up in `attachments` and the job steps aside.
 */
export function useAttachmentUploads({
  requestId,
  attachments,
}: {
  requestId: string | null;
  /** The Request's live rows, as the detail last reported them. */
  attachments: readonly Attachment[];
}) {
  const { t } = useTranslation();
  const upload = useUploadAttachment();
  const nextKey = useRef(0);
  const waiting = useRef(new Map<number, File>());
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  // Rows registered this session whose bytes never arrived. The server keeps
  // them UPLOADING until its sweep; the list shows them as failed at once.
  const [failedIds, setFailedIds] = useState<string[]>([]);

  const landed = (job: UploadJob) =>
    job.attachmentId !== undefined && attachments.some((a) => a.id === job.attachmentId);
  const visible = jobs.filter((job) => !landed(job));
  const pending = visible.filter((job) => !job.error);
  const queued = pending.filter((job) => job.queued).length;
  const inFlight = pending.length - queued;
  const failed = visible.length - pending.length;
  const remaining = MAX_ATTACHMENTS_PER_REQUEST - attachmentSlotsUsed(attachments) - pending.length;

  function patch(key: number, change: Partial<UploadJob>) {
    setJobs((current) => current.map((job) => (job.key === key ? { ...job, ...change } : job)));
  }

  function send(file: File, key: number, id: string) {
    upload
      .mutateAsync({
        requestId: id,
        file,
        onProgress: (fraction) => patch(key, { progress: fraction }),
      })
      .then((attachment) => patch(key, { attachmentId: attachment.id, progress: 1 }))
      .catch((error: unknown) => {
        // The row exists but its bytes never arrived: let the list own it as
        // failed rather than showing "checking" beside a local error.
        if (error instanceof UploadError && error.attachmentId) {
          const lost = error.attachmentId;
          setFailedIds((current) => [...current, lost]);
          patch(key, { attachmentId: lost });
          return;
        }
        patch(key, { error: uploadErrorMessage(error, t) });
      });
  }

  function pick(files: ArrayLike<File> | null) {
    if (!files || files.length === 0) return;
    const added: UploadJob[] = [];
    let open = remaining;
    for (const file of Array.from(files)) {
      const contentType = declaredContentType(file);
      const job: UploadJob = {
        key: nextKey.current++,
        fileName: file.name,
        contentType,
        size: file.size,
        progress: 0,
        queued: false,
      };
      if (open <= 0) job.error = t.attachments.limitReached;
      else if (!isAcceptedContentType(contentType)) job.error = t.attachments.unsupportedType;
      else if (file.size > MAX_ATTACHMENT_BYTES) job.error = t.attachments.tooLarge;
      added.push(job);
      if (job.error) continue;
      open -= 1;
      if (requestId === null) {
        job.queued = true;
        waiting.current.set(job.key, file);
      } else {
        send(file, job.key, requestId);
      }
    }
    setJobs((current) => [...current, ...added]);
  }

  /** Sends every waiting file to the Request that now exists; returns how many. */
  function start(id: string): number {
    const entries = Array.from(waiting.current);
    waiting.current.clear();
    for (const [key, file] of entries) send(file, key, id);
    setJobs((current) => current.map((job) => (job.queued ? { ...job, queued: false } : job)));
    return entries.length;
  }

  /** Drops a waiting or failed job; a job mid-flight keeps going. */
  function remove(key: number) {
    waiting.current.delete(key);
    setJobs((current) => current.filter((job) => job.key !== key));
  }

  function reset() {
    waiting.current.clear();
    setJobs([]);
    setFailedIds([]);
  }

  return {
    jobs: visible,
    failedIds,
    queued,
    inFlight,
    failed,
    remaining,
    full: remaining <= 0,
    pick,
    start,
    remove,
    reset,
  };
}
