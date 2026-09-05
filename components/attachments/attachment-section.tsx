"use client";

import { useDeleteAttachment, useGroup } from "@/lib/api/queries";
import type { Attachment, VacationDetail } from "@/lib/api/types";
import { MAX_ATTACHMENTS_PER_REQUEST, attachmentSlotsUsed } from "@/lib/attachments/rules";
import { useAttachmentUploads } from "@/lib/attachments/use-attachment-uploads";
import { useSession } from "@/lib/auth-client";
import { useTranslation } from "@/lib/i18n/use-translation";
import { namedPeople } from "@/lib/vacations/timeline";
import { AttachmentList } from "./attachment-list";
import { AttachmentUploader } from "./attachment-uploader";

/**
 * The attachments block of a record detail. It exists only when the payload
 * carries the attachments field: a view-only member gets no field and so no
 * block, not even an empty one. The backend's `canAttach` already accounts
 * for standing, plan and the cap; the group's flag is read separately only to
 * say *why* the picker is missing when the plan is the reason.
 */
export function AttachmentSection({ detail }: { detail: VacationDetail }) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const attachments = detail.attachments;
  const group = useGroup(attachments ? detail.groupId : null);
  const live = (attachments ?? []).filter((a) => a.deletedAt === null);
  const uploads = useAttachmentUploads({
    requestId: detail.requestId,
    attachments: attachments ?? [],
  });
  const remove = useDeleteAttachment();

  if (!attachments) return null;

  // Mirrors the backend's standing rule, before plan and cap: the owner while
  // the request is live and undecided against, or an editing admin.
  const userId = session?.user?.id;
  const isOwner = userId === detail.userId;
  const requestLive = detail.deletedAt === null && detail.rejectedAt === null;
  const mayUpload = (isOwner && requestLive) || detail.canEdit;
  const slotsUsed = attachmentSlotsUsed(live);
  const uploadsOff = group.data?.uploadsAvailable === false;
  const showLapsed = mayUpload && uploadsOff;
  const showPicker =
    mayUpload &&
    !uploadsOff &&
    (detail.canAttach === true || slotsUsed >= MAX_ATTACHMENTS_PER_REQUEST);

  if (live.length === 0 && !showPicker && !showLapsed) return null;

  // The uploader may always delete their own file; the flag covers everyone
  // else's, and falls back to `canEdit` against a backend that predates it.
  const adminDeletes = detail.canDeleteAnyAttachment ?? detail.canEdit;
  const canDelete = (attachment: Attachment) =>
    (userId !== undefined && attachment.uploadedByUserId === userId) || adminDeletes;

  return (
    <section aria-labelledby="attachments-heading" className="space-y-3">
      <h3 id="attachments-heading" className="text-sm font-medium">
        {t.attachments.title}
      </h3>
      {uploads.settled.length > 0 ? (
        <AttachmentList
          attachments={uploads.settled}
          people={namedPeople(detail)}
          failedIds={uploads.failedIds}
          canDelete={canDelete}
          onDelete={(attachment) => remove.mutateAsync(attachment.id)}
        />
      ) : null}
      {showPicker ? (
        <AttachmentUploader uploads={uploads} disabled={detail.canAttach !== true} />
      ) : null}
      {showLapsed ? (
        <p className="text-muted-foreground text-xs">{t.attachments.paidPlanOnly}</p>
      ) : null}
    </section>
  );
}
