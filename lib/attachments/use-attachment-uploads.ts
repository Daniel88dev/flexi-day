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
  rememberFailedUpload,
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
  /** Set as soon as the backend has the row, while the bytes are still going. */
  attachmentId?: string;
  /** The bytes landed, or failed for good; the caller's list owns the row from here. */
  done: boolean;
  error?: string;
};

type CreateFailure = { reason?: "UNSUPPORTED_TYPE" | "FILE_TOO_LARGE" | "ATTACHMENT_LIMIT" };

function uploadErrorMessage(error: unknown, t: Dictionary): string {
  if (error instanceof ApiError) {
    if (error.status === 402) return t.attachments.paidPlanOnly;
    if (error.status === 403) return t.attachments.attachForbidden;
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
  /** Every row of the Request as the detail last reported it, deleted ones included. */
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

  // A row exists from registration on, so a refetch mid-transfer would show
  // the same file twice and count its slot twice. The job owns it until the
  // bytes land; the caller lists `settled` instead of its own rows.
  const inFlightIds = jobs.flatMap((job) =>
    job.attachmentId !== undefined && !job.done && !job.error ? [job.attachmentId] : []
  );
  const settled = attachments.filter((a) => a.deletedAt === null && !inFlightIds.includes(a.id));
  // Against every row, not the live ones: a job whose row was deleted since
  // has still landed, and must not come back as a ghost.
  const landed = (job: UploadJob) =>
    job.done &&
    job.attachmentId !== undefined &&
    attachments.some((a) => a.id === job.attachmentId);
  const visible = jobs.filter((job) => !landed(job));
  const pending = visible.filter((job) => !job.error);
  const queued = pending.filter((job) => job.queued).length;
  const inFlight = pending.length - queued;
  const failed = visible.length - pending.length;
  const remaining = MAX_ATTACHMENTS_PER_REQUEST - attachmentSlotsUsed(settled) - pending.length;

  function patch(key: number, change: Partial<UploadJob>) {
    setJobs((current) => current.map((job) => (job.key === key ? { ...job, ...change } : job)));
  }

  function send(file: File, key: number, id: string) {
    upload
      .mutateAsync({
        requestId: id,
        file,
        onRegistered: (attachmentId) => patch(key, { attachmentId }),
        onProgress: (fraction) => patch(key, { progress: fraction }),
      })
      .then((attachment) => patch(key, { attachmentId: attachment.id, done: true, progress: 1 }))
      .catch((error: unknown) => {
        // The row exists but its bytes never arrived. The job shows the
        // failure until the refetched row arrives to take over as failed.
        if (error instanceof UploadError && error.attachmentId) {
          const lost = error.attachmentId;
          rememberFailedUpload(lost);
          setFailedIds((current) => [...current, lost]);
          patch(key, { attachmentId: lost, done: true, error: t.attachments.failed });
          return;
        }
        patch(key, { error: uploadErrorMessage(error, t) });
      });
  }

  // The jobs enter the state before any transfer starts, so a registration
  // that answers at once still finds its job to stamp the id on.
  function pick(files: ArrayLike<File> | null) {
    if (!files || files.length === 0) return;
    const added: UploadJob[] = [];
    const sending: [File, number][] = [];
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
        done: false,
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
        sending.push([file, job.key]);
      }
    }
    setJobs((current) => [...current, ...added]);
    for (const [file, key] of sending) send(file, key, requestId!);
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
    /** The Request's live rows minus those whose bytes this session is still sending. */
    settled,
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
