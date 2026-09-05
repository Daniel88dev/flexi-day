"use client";

import { useGroup } from "@/lib/api/queries";
import type { UserSummary, VacationDetail } from "@/lib/api/types";
import { MAX_ATTACHMENTS_PER_REQUEST, attachmentSlotsUsed } from "@/lib/attachments/rules";
import { useAttachmentUploads } from "@/lib/attachments/use-attachment-uploads";
import { useSession } from "@/lib/auth-client";
import { useTranslation } from "@/lib/i18n/use-translation";
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
  const uploads = useAttachmentUploads({ requestId: detail.requestId, attachments: live });

  if (!attachments) return null;

  // Mirrors the backend's standing rule, before plan and cap: the owner while
  // the request is live and undecided against, or an editing admin.
  const isOwner = session?.user?.id === detail.userId;
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

  const people = [
    detail.user,
    detail.createdByUser,
    detail.approvedByUser,
    detail.rejectedByUser,
    detail.deletedByUser,
  ].filter((p): p is UserSummary => p !== null);

  return (
    <section aria-labelledby="attachments-heading" className="space-y-3">
      <h3 id="attachments-heading" className="text-sm font-medium">
        {t.attachments.title}
      </h3>
      {live.length > 0 ? (
        <AttachmentList attachments={live} people={people} failedIds={uploads.failedIds} />
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
