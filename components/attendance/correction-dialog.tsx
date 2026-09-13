"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import type { AttendanceEvent, AttendanceSession } from "@/lib/api/attendance";
import {
  useAttendanceDay,
  useCorrectBreak,
  useCorrectSession,
  useRemoveBreak,
  useRemoveSession,
  useSessionEvents,
} from "@/lib/api/queries";
import {
  correctionErrors,
  sessionDraft,
  toBreakPatch,
  toPatch,
  type BreakDraft,
  type CorrectionError,
  type SessionDraft,
} from "@/lib/attendance/correction";
import { formatBusinessDay, formatClockTime } from "@/lib/attendance/today";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Dictionary } from "@/lib/i18n";

/** An instant as `Wed 08:05` in the organization's zone — the timeline's stamp. */
function eventStamp(iso: string, timezone: string | null, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const weekday = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(date);
  return `${weekday} ${formatClockTime(iso, timezone)}`;
}

function FieldError({ error }: { error: CorrectionError | undefined }) {
  const { t } = useTranslation();
  if (!error) return null;
  return (
    <span className="text-xs" style={{ color: "var(--destructive)" }}>
      {t.corrections.errors[error]}
    </span>
  );
}

/** The server's own refusal, in the reader's language where it has a reason to go by. */
function correctionMessage(error: unknown, t: Dictionary): string {
  if (!(error instanceof ApiError)) return t.corrections.saveFailed;

  const reason = error.context<{ reason?: string }>()?.reason;
  const wording: Record<string, string> = t.corrections.errors;

  return (reason ? wording[reason] : undefined) ?? error.message ?? t.corrections.saveFailed;
}

function History({ sessionId, timezone }: { sessionId: string; timezone: string | null }) {
  const { t, locale } = useTranslation();
  const query = useSessionEvents(sessionId);

  const entries: AttendanceEvent[] = query.data ?? [];

  return (
    <div className="flex flex-col gap-1.5">
      <span
        className="text-[11px] font-bold tracking-[0.06em] uppercase"
        style={{ color: "var(--text-faint)" }}
      >
        {t.corrections.history}
      </span>
      {query.isPending ? (
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {t.common.loading}
        </span>
      ) : entries.length === 0 ? (
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {t.corrections.historyEmpty}
        </span>
      ) : (
        <ul className="flex flex-col gap-1" data-testid="correction-history">
          {entries.map((event) => (
            <li key={event.id} className="flex gap-3 text-sm">
              <span className="w-24 shrink-0 tabular-nums" style={{ color: "var(--text-faint)" }}>
                {eventStamp(event.createdAt, timezone, locale)}
              </span>
              <span>
                {t.corrections.events[event.eventType]}.{" "}
                <span style={{ color: "var(--text-muted)" }}>
                  {/* The sweep and a deleted account read the same, because
                      neither is a person anyone can ask about it. */}
                  {event.user?.name ?? t.corrections.system}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * One session's fields, its breaks and its history. Remounted by its `key`
 * whenever the answer changes, so the draft is derived from the row rather
 * than kept in sync with it.
 */
function SessionCorrection({
  session,
  timezone,
  onDone,
}: {
  session: AttendanceSession;
  timezone: string | null;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<SessionDraft>(() => sessionDraft(session, timezone));
  const [confirming, setConfirming] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const correctSession = useCorrectSession();
  const correctBreak = useCorrectBreak();
  const removeBreak = useRemoveBreak();
  const removeSession = useRemoveSession();

  const errors = correctionErrors(draft, session.businessDate, timezone);
  const invalid = Boolean(errors.startedAt ?? errors.endedAt ?? errors.breaks);
  const saving =
    correctSession.isPending ||
    correctBreak.isPending ||
    removeBreak.isPending ||
    removeSession.isPending;

  const setBreak = (id: string, patch: Partial<BreakDraft>) =>
    setDraft((current) => ({
      ...current,
      breaks: current.breaks.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    }));

  const save = async () => {
    setFailure(null);
    const sessionPatch = toPatch(session, draft, timezone);
    const breakPatches = session.breaks.flatMap((entry) => {
      const patch = toBreakPatch(entry, draft, session.businessDate, timezone);
      return patch ? [{ breakId: entry.id, patch }] : [];
    });

    // A session that is being narrowed has to take its breaks in first, or the
    // guard that keeps a break inside its session refuses the session itself.
    // Widening is the other way round, for the same reason.
    const later = (next: string, current: string) => Date.parse(next) > Date.parse(current);
    const narrowing =
      (sessionPatch?.startedAt !== undefined && later(sessionPatch.startedAt, session.startedAt)) ||
      (typeof sessionPatch?.endedAt === "string" &&
        session.endedAt !== null &&
        later(session.endedAt, sessionPatch.endedAt));

    const applySession = async () => {
      if (sessionPatch)
        await correctSession.mutateAsync({ sessionId: session.id, patch: sessionPatch });
    };
    const applyBreaks = async () => {
      for (const entry of breakPatches) await correctBreak.mutateAsync(entry);
    };

    try {
      if (narrowing) {
        await applyBreaks();
        await applySession();
      } else {
        await applySession();
        await applyBreaks();
      }
      onDone();
    } catch (error) {
      setFailure(correctionMessage(error, t));
    }
  };

  const drop = async (breakId: string) => {
    setFailure(null);
    try {
      await removeBreak.mutateAsync(breakId);
    } catch (error) {
      setFailure(correctionMessage(error, t));
    }
  };

  const discard = async () => {
    setFailure(null);
    try {
      await removeSession.mutateAsync(session.id);
      onDone();
    } catch (error) {
      setFailure(correctionMessage(error, t));
    }
  };

  const swept = session.closedBy === "SWEEP";

  return (
    <div
      className="flex flex-col gap-4 rounded-2xl border p-4"
      style={{ borderColor: "var(--border)" }}
      data-testid={`correction-session-${session.id}`}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`in-${session.id}`}>{t.corrections.clockIn}</Label>
          <Input
            id={`in-${session.id}`}
            type="time"
            value={draft.startedAt}
            onChange={(event) => setDraft({ ...draft, startedAt: event.target.value })}
          />
          <FieldError error={errors.startedAt} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`out-${session.id}`}>{t.corrections.clockOut}</Label>
          <Input
            id={`out-${session.id}`}
            type="time"
            value={draft.endedAt}
            onChange={(event) => setDraft({ ...draft, endedAt: event.target.value })}
          />
          <FieldError error={errors.endedAt} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {session.endedAt === null
              ? t.corrections.stillOpenHint
              : swept
                ? t.corrections.wasSwept(formatClockTime(session.endedAt, timezone))
                : t.corrections.was(formatClockTime(session.endedAt, timezone))}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t.corrections.breaks}</span>
        {draft.breaks.length === 0 ? (
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t.corrections.noBreaks}
          </span>
        ) : (
          draft.breaks.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor={`break-start-${entry.id}`} className="sr-only">
                  {t.corrections.breaks}
                </Label>
                <Input
                  id={`break-start-${entry.id}`}
                  type="time"
                  className="w-32"
                  value={entry.startedAt}
                  onChange={(event) => setBreak(entry.id, { startedAt: event.target.value })}
                />
                <span style={{ color: "var(--text-muted)" }}>{t.corrections.to}</span>
                <Label htmlFor={`break-end-${entry.id}`} className="sr-only">
                  {t.corrections.to}
                </Label>
                <Input
                  id={`break-end-${entry.id}`}
                  type="time"
                  className="w-32"
                  value={entry.endedAt}
                  onChange={(event) => setBreak(entry.id, { endedAt: event.target.value })}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={t.corrections.removeBreak}
                  disabled={saving}
                  onClick={() => void drop(entry.id)}
                >
                  <X />
                </Button>
              </div>
              <FieldError error={errors.breaks?.[entry.id]} />
            </div>
          ))
        )}
      </div>

      <History sessionId={session.id} timezone={timezone} />

      {failure ? (
        <p className="text-sm" style={{ color: "var(--destructive)" }} role="alert">
          {failure}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {confirming ? (
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t.corrections.deleteSessionConfirm}
            </span>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={saving}
              onClick={() => void discard()}
            >
              <Trash2 />
              {t.corrections.deleteSession}
            </Button>
          </span>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={saving}
            onClick={() => setConfirming(true)}
          >
            <Trash2 />
            {t.corrections.deleteSession}
          </Button>
        )}

        <Button type="button" disabled={invalid || saving} onClick={() => void save()}>
          {saving ? t.corrections.saving : t.corrections.save}
        </Button>
      </div>
    </div>
  );
}

/**
 * The correction dialog, opened from either attendance screen: an admin from a
 * cell of the team matrix, a person from their own day.
 *
 * It reads the day rather than being handed it, because the team dashboard
 * carries figures and not sessions — and because a correction has to re-read
 * what it just changed.
 *
 * Who may actually save is the backend's call. An employee outside the
 * self-service window is told so by the 403 they get, with the same wording
 * the hint under their own day carries.
 */
export function CorrectionDialog({
  organizationId,
  userId,
  personName,
  businessDate,
  open,
  onOpenChange,
}: {
  organizationId: string;
  /** Somebody else's day, for an admin; null for the reader's own. */
  userId?: string | null;
  personName?: string;
  businessDate: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, locale } = useTranslation();
  const query = useAttendanceDay(open ? { organizationId, businessDate, userId } : null, open);

  const day = formatBusinessDay(businessDate, locale);

  const timezone = query.data?.timezone ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="capitalize">{t.corrections.title(day)}</DialogTitle>
          <DialogDescription>
            {personName ?? (userId ? "" : t.corrections.selfServiceHint)}
          </DialogDescription>
        </DialogHeader>

        {query.isPending ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t.corrections.loading}
          </p>
        ) : query.error ? (
          <p className="text-sm" style={{ color: "var(--destructive)" }}>
            {query.error instanceof ApiError && query.error.status === 403
              ? t.corrections.errors.SELF_SERVICE_WINDOW
              : t.corrections.loadFailed}
          </p>
        ) : query.data && query.data.sessions.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t.corrections.noSessions}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {(query.data?.sessions ?? []).map((session) => (
              <SessionCorrection
                // The draft is derived from the row, so a saved change comes
                // back as a new component rather than as state to reconcile.
                key={`${session.id}:${session.startedAt}:${session.endedAt ?? "open"}:${session.breaks
                  .map((entry) => `${entry.id}${entry.startedAt}${entry.endedAt ?? ""}`)
                  .join(",")}`}
                session={session}
                timezone={timezone}
                onDone={() => onOpenChange(false)}
              />
            ))}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t.corrections.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
