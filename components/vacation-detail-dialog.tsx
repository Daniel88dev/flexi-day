"use client";

import { useState } from "react";
import { Check, Clock, MessageSquare, Paperclip, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AvatarBubble } from "@/components/brand/avatar-bubble";
import {
  useApproveVacations,
  useCancelVacations,
  useCommentVacation,
  useRejectVacations,
  useVacation,
} from "@/lib/api/queries";
import { CALENDAR_RECORD_TYPE_COLORS, vacationStatus, type VacationStatus } from "@/lib/api/types";
import { dayLengthLabel } from "@/lib/vacations/day-length";
import { mergeTimeline, type TimelineEntry, type TimelineKind } from "@/lib/vacations/timeline";
import { vacationActionErrorMessage, type VacationAction } from "@/lib/vacations/action-error";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Dictionary } from "@/lib/i18n";
import { EditRequestDialog } from "@/components/edit-request-dialog";
import { AttachmentSection } from "@/components/attachments/attachment-section";
import { recordTypeLabel } from "@/lib/i18n/record-type-label";

const STATUS_BADGE: Record<VacationStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  cancelled: "bg-muted text-muted-foreground",
};

const EVENT_META: Record<TimelineKind, { icon: typeof Check; tint: string }> = {
  CREATED: { icon: Plus, tint: "var(--text-muted)" },
  APPROVED: { icon: Check, tint: "var(--c-home)" },
  REJECTED: { icon: X, tint: "var(--destructive)" },
  CANCELLED: { icon: Clock, tint: "var(--warm)" },
  COMMENT: { icon: MessageSquare, tint: "var(--text-muted)" },
  UPDATED: { icon: Pencil, tint: "var(--text-muted)" },
  ATTACHMENT_ADDED: { icon: Paperclip, tint: "var(--text-muted)" },
  ATTACHMENT_REMOVED: { icon: Trash2, tint: "var(--warm)" },
};

function formatDay(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDayRange(startIso: string, endIso: string, locale: string) {
  const start = formatDay(startIso, locale);
  return startIso === endIso ? start : `${start} – ${formatDay(endIso, locale)}`;
}

function formatMoment(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * The full story of one request: what was asked for, where it stands, what
 * happened to it, and the actions this user is allowed to take. The backend
 * decides `canApprove` / `canCancel`, so the dialog never offers a button the
 * API would reject.
 */
export function VacationDetailDialog({
  vacationId,
  open,
  onOpenChange,
}: {
  vacationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const detailQuery = useVacation(open ? vacationId : null);
  const approve = useApproveVacations();
  const reject = useRejectVacations();
  const cancel = useCancelVacations();
  const comment = useCommentVacation();

  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const detail = detailQuery.data;
  const isMutating = approve.isPending || reject.isPending || cancel.isPending || comment.isPending;

  function close(nextOpen: boolean) {
    if (!nextOpen) {
      setReason("");
      setActionError(null);
    }
    onOpenChange(nextOpen);
  }

  async function run(action: VacationAction, mutate: () => Promise<unknown>) {
    setActionError(null);
    try {
      await mutate();
      setReason("");
    } catch (err) {
      setActionError(vacationActionErrorMessage(err, action, t));
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.vacationDetail.title}</DialogTitle>
          <DialogDescription>
            {detail
              ? `${detail.groupName} · ${formatDayRange(
                  detail.rangeStart ?? detail.requestedDay,
                  detail.rangeEnd ?? detail.requestedDay,
                  t.common.dateLocale
                )}`
              : t.common.loading}
          </DialogDescription>
        </DialogHeader>

        {detailQuery.isLoading ? (
          <p className="text-muted-foreground py-6 text-center text-sm">{t.common.loading}</p>
        ) : detailQuery.error ? (
          <p className="text-destructive py-6 text-center text-sm">{detailQuery.error.message}</p>
        ) : detail ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  CALENDAR_RECORD_TYPE_COLORS[detail.vacationType]
                )}
              >
                {recordTypeLabel(t.calendarRecordTypes, detail.vacationType)}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  STATUS_BADGE[vacationStatus(detail)]
                )}
              >
                {t.status[vacationStatus(detail)]}
              </span>
              <span className="text-muted-foreground text-xs">
                {dayLengthLabel(detail, {
                  halfDay: t.vacationDetail.halfDay,
                  fullDay: t.vacationDetail.fullDay,
                })}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <AvatarBubble
                initials={detail.user.initials}
                background={detail.user.avatarColor}
                name={detail.user.name}
                size={30}
              />
              <div>
                <div className="text-sm font-medium">{detail.user.name}</div>
                <div className="text-muted-foreground text-xs">{detail.groupName}</div>
              </div>
            </div>

            {detail.createdByUser && detail.createdByUser.id !== detail.userId ? (
              <p className="text-muted-foreground text-xs">
                {t.vacationDetail.createdBy(detail.createdByUser.name)}
              </p>
            ) : null}
            {detail.deletedAt && detail.deletedByUser ? (
              <p className="text-muted-foreground text-xs">
                {t.vacationDetail.cancelledBy(detail.deletedByUser.name)}
              </p>
            ) : null}

            {detail.note ? (
              <div className="bg-muted/50 rounded-2xl px-3 py-2 text-sm">{detail.note}</div>
            ) : null}

            <AttachmentSection detail={detail} />

            <Timeline entries={mergeTimeline(detail)} t={t} />

            {actionError ? (
              <p role="alert" className="text-destructive text-sm">
                {actionError}
              </p>
            ) : null}

            <div className="space-y-2 border-t pt-4">
              <Textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t.vacationDetail.commentPlaceholder}
                aria-label={t.vacationDetail.commentAriaLabel}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isMutating || reason.trim().length === 0}
                  onClick={() =>
                    run("comment", () =>
                      comment.mutateAsync({ id: detail.id, message: reason.trim() })
                    )
                  }
                >
                  {comment.isPending ? t.vacationDetail.sending : t.vacationDetail.comment}
                </Button>
                <div className="flex flex-wrap justify-end gap-2">
                  {detail.canEdit ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isMutating}
                      onClick={() => setEditOpen(true)}
                    >
                      {t.vacationDetail.edit}
                    </Button>
                  ) : null}
                  {detail.canApprove ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/30"
                        disabled={isMutating}
                        onClick={() =>
                          run("approve", () => approve.mutateAsync(detail.vacationIds))
                        }
                      >
                        {t.vacationDetail.approve}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                        disabled={isMutating}
                        onClick={() =>
                          run("reject", () =>
                            reject.mutateAsync({
                              ids: detail.vacationIds,
                              reason: reason.trim() || undefined,
                            })
                          )
                        }
                      >
                        {t.vacationDetail.decline}
                      </Button>
                    </>
                  ) : null}
                  {detail.canCancel ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isMutating}
                      onClick={() =>
                        run("cancel", () =>
                          cancel.mutateAsync({
                            ids: detail.vacationIds,
                            reason: reason.trim() || undefined,
                          })
                        )
                      }
                    >
                      {t.vacationDetail.cancelRequest}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
      {detail && detail.canEdit ? (
        // Keyed on updatedAt so a refetched detail remounts the form with
        // fresh initial values instead of the pre-edit ones.
        <EditRequestDialog
          key={`${detail.id}-${detail.updatedAt}`}
          detail={detail}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      ) : null}
    </Dialog>
  );
}

function Timeline({ entries, t }: { entries: TimelineEntry[]; t: Dictionary }) {
  if (entries.length === 0) {
    return <p className="text-muted-foreground text-sm">{t.vacationDetail.noHistory}</p>;
  }

  return (
    <ol className="space-y-3">
      {entries.map((entry) => {
        const meta = EVENT_META[entry.kind];
        const Icon = meta.icon;
        const by =
          entry.actor.kind === "named"
            ? t.vacationDetail.byActor(entry.actor.user.name)
            : entry.actor.kind === "unnamed"
              ? t.vacationDetail.byAdmin
              : null;
        return (
          <li key={entry.id} className="flex gap-3">
            <span
              className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full"
              style={{
                background: `color-mix(in oklch, ${meta.tint} 16%, transparent)`,
                color: meta.tint,
              }}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 text-sm">
              <div>
                <span className="font-medium">{t.vacationDetail.events[entry.kind]}</span>
                {by ? <span className="text-muted-foreground">{by}</span> : null}
              </div>
              <div className="text-muted-foreground text-xs">
                {formatMoment(entry.createdAt, t.common.dateLocale)}
              </div>
              {entry.fileName ? (
                <div className="mt-1 truncate text-xs">{entry.fileName}</div>
              ) : null}
              {entry.reason ? <div className="mt-1 text-xs">“{entry.reason}”</div> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
