"use client";

import { useState } from "react";
import { Check, Clock, Plus, X } from "lucide-react";
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
  useApproveVacation,
  useCancelVacation,
  useRejectVacation,
  useVacation,
} from "@/lib/api/queries";
import {
  VACATION_KIND_COLORS,
  VACATION_KIND_LABELS,
  vacationStatus,
  type VacationDetail,
  type VacationEvent,
  type VacationEventKind,
  type VacationStatus,
} from "@/lib/api/types";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<VacationStatus | "cancelled", string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  cancelled: "bg-muted text-muted-foreground",
};

const EVENT_META: Record<VacationEventKind, { label: string; icon: typeof Check; tint: string }> = {
  CREATED: { label: "Requested", icon: Plus, tint: "var(--text-muted)" },
  APPROVED: { label: "Approved", icon: Check, tint: "var(--c-home)" },
  REJECTED: { label: "Declined", icon: X, tint: "var(--destructive)" },
  CANCELLED: { label: "Cancelled", icon: Clock, tint: "var(--warm)" },
};

/** A cancelled request keeps its approved/rejected stamps, so check deletion first. */
function detailStatus(detail: VacationDetail): VacationStatus | "cancelled" {
  return detail.deletedAt ? "cancelled" : vacationStatus(detail);
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMoment(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
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
  const detailQuery = useVacation(open ? vacationId : null);
  const approve = useApproveVacation();
  const reject = useRejectVacation();
  const cancel = useCancelVacation();

  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const detail = detailQuery.data;
  const isMutating = approve.isPending || reject.isPending || cancel.isPending;

  function close(nextOpen: boolean) {
    if (!nextOpen) {
      setReason("");
      setActionError(null);
    }
    onOpenChange(nextOpen);
  }

  async function run(action: () => Promise<unknown>) {
    setActionError(null);
    try {
      await action();
      setReason("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request details</DialogTitle>
          <DialogDescription>
            {detail ? `${detail.groupName} · ${formatDay(detail.requestedDay)}` : "Loading…"}
          </DialogDescription>
        </DialogHeader>

        {detailQuery.isLoading ? (
          <p className="text-muted-foreground py-6 text-center text-sm">Loading…</p>
        ) : detailQuery.error ? (
          <p className="text-destructive py-6 text-center text-sm">{detailQuery.error.message}</p>
        ) : detail ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  VACATION_KIND_COLORS[detail.vacationType]
                )}
              >
                {VACATION_KIND_LABELS[detail.vacationType]}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                  STATUS_BADGE[detailStatus(detail)]
                )}
              >
                {detailStatus(detail)}
              </span>
              <span className="text-muted-foreground text-xs">
                {detail.startTime && detail.endTime
                  ? `${detail.startTime.slice(0, 5)} – ${detail.endTime.slice(0, 5)}`
                  : "Full day"}
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

            {detail.note ? (
              <div className="bg-muted/50 rounded-2xl px-3 py-2 text-sm">{detail.note}</div>
            ) : null}

            <Timeline history={detail.history} />

            {actionError ? <p className="text-destructive text-sm">{actionError}</p> : null}

            {detail.canApprove || detail.canCancel ? (
              <div className="space-y-2 border-t pt-4">
                <Textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason (optional) — shown in the request history"
                  aria-label="Reason"
                />
                <div className="flex flex-wrap justify-end gap-2">
                  {detail.canApprove ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/30"
                        disabled={isMutating}
                        onClick={() => run(() => approve.mutateAsync(detail.id))}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                        disabled={isMutating}
                        onClick={() =>
                          run(() =>
                            reject.mutateAsync({ id: detail.id, reason: reason.trim() || undefined })
                          )
                        }
                      >
                        Decline
                      </Button>
                    </>
                  ) : null}
                  {detail.canCancel ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isMutating}
                      onClick={() =>
                        run(() =>
                          cancel.mutateAsync({ id: detail.id, reason: reason.trim() || undefined })
                        )
                      }
                    >
                      Cancel request
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Timeline({ history }: { history: VacationEvent[] }) {
  if (history.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No history recorded for this request — it predates request history.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {history.map((event) => {
        const meta = EVENT_META[event.eventType];
        const Icon = meta.icon;
        return (
          <li key={event.id} className="flex gap-3">
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
                <span className="font-medium">{meta.label}</span>
                {event.actor ? (
                  <span className="text-muted-foreground"> by {event.actor.name}</span>
                ) : null}
              </div>
              <div className="text-muted-foreground text-xs">{formatMoment(event.createdAt)}</div>
              {event.reason ? <div className="mt-1 text-xs">“{event.reason}”</div> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
