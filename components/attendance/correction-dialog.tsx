"use client";

import { useState } from "react";
import { CalendarPlus, Check, Trash2 } from "lucide-react";
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
import type { AttendanceBreakSpan, AttendanceEvent, AttendanceSession } from "@/lib/api/attendance";
import {
  useAddBreak,
  useAttendanceDay,
  useCorrectBreak,
  useCorrectSession,
  useMarkSessionChecked,
  useRemoveBreak,
  useRemoveSession,
  useSessionEvents,
} from "@/lib/api/queries";
import {
  correctionErrors,
  draftEdited,
  sessionDraft,
  toBreakPatch,
  toNewBreaks,
  toPatch,
  type CorrectionError,
  type SessionDraft,
} from "@/lib/attendance/correction";
import {
  correctableUntil,
  selfServiceVerdict,
  type SelfServiceWindow,
} from "@/lib/attendance/self-service";
import { formatBusinessDay, formatClockTime } from "@/lib/attendance/today";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Dictionary } from "@/lib/i18n";
import { ChangedMark, ChangedNotice, EnteredMark } from "./attendance-figures";
import { BreakRows, breakMessage, useBreakDrafts } from "./break-rows";

/**
 * An instant as `Thu 10 Sep 08:52` in the organization's zone — the timeline's
 * stamp. It carries the date because an entry or a correction can come days
 * after the session it changes.
 */
function eventStamp(iso: string, timezone: string | null, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const day = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(date);
  return `${day} ${formatClockTime(iso, timezone)}`;
}

function eventText(event: AttendanceEvent, timezone: string | null, t: Dictionary): string {
  const after = event.after as { startedAt?: unknown; endedAt?: unknown } | null;
  if (typeof after?.startedAt === "string" && typeof after.endedAt === "string") {
    const from = formatClockTime(after.startedAt, timezone);
    const to = formatClockTime(after.endedAt, timezone);
    if (event.eventType === "SESSION_CREATED") return t.corrections.sessionEntered(from, to);
    if (event.eventType === "BREAK_ADDED") return t.corrections.breakAdded(from, to);
  }
  return t.corrections.events[event.eventType];
}

function FieldError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return (
    <span className="text-xs" style={{ color: "var(--destructive)" }}>
      {message}
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
              <span className="w-32 shrink-0 tabular-nums" style={{ color: "var(--text-faint)" }}>
                {eventStamp(event.createdAt, timezone, locale)}
              </span>
              <span>
                {eventText(event, timezone, t)}.{" "}
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

/** The id the server gave a break it just added, found by its times in the session it answered with. */
const savedBreakId = (saved: AttendanceSession, span: AttendanceBreakSpan): string | undefined =>
  saved.breaks.find(
    (entry) =>
      entry.endedAt !== null &&
      Date.parse(entry.startedAt) === Date.parse(span.startedAt) &&
      Date.parse(entry.endedAt) === Date.parse(span.endedAt)
  )?.id;

/**
 * One session's fields, its breaks and its history. Remounted by its `key`
 * whenever the answer changes, so the draft is derived from the row rather
 * than kept in sync with it.
 */
function SessionCorrection({
  session,
  timezone,
  ownDay,
  personName,
  onDone,
}: {
  session: AttendanceSession;
  timezone: string | null;
  ownDay?: { today: string; userId: string; administersOwn: boolean };
  personName?: string;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const events = useSessionEvents(session.id);
  const entered = session.origin === "ENTERED";
  const changed = session.changedAfterDay === true;
  const adminReviewing = !ownDay && changed;
  // Only the owner's own writes set the flag; an admin's never do, their own day included.
  const flagsOnSave =
    ownDay !== undefined && !ownDay.administersOwn && session.businessDate < ownDay.today;
  // Only the mark's name comes from the history; who may delete goes by the session.
  const created = events.data?.find((event) => event.eventType === "SESSION_CREATED");
  const enteredByOwner =
    ownDay !== undefined && entered && session.enteredByUserId === ownDay.userId;
  // The API's rule: an entered session only by whoever entered it, whatever its
  // date; a clocked one only on its own day.
  const deletable = !ownDay || (entered ? enteredByOwner : session.businessDate === ownDay.today);
  const [times, setTimes] = useState(() => sessionDraft(session, timezone));
  const rows = useBreakDrafts(() => sessionDraft(session, timezone).breaks);
  const draft: SessionDraft = { ...times, breaks: rows.breaks };
  const [confirming, setConfirming] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const correctSession = useCorrectSession();
  const correctBreak = useCorrectBreak();
  const removeBreak = useRemoveBreak();
  const removeSession = useRemoveSession();
  const addBreak = useAddBreak();
  const markChecked = useMarkSessionChecked();

  const errors = correctionErrors(draft, session.businessDate, timezone);
  const edited = draftEdited(session, draft, timezone);
  const invalid = Boolean(errors.startedAt ?? errors.endedAt ?? errors.breaks);
  const saving =
    correctSession.isPending ||
    correctBreak.isPending ||
    removeBreak.isPending ||
    removeSession.isPending ||
    addBreak.isPending ||
    markChecked.isPending;

  const fieldMessage = (error: CorrectionError | undefined) =>
    error ? t.corrections.errors[error] : undefined;

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
    const newBreaks = toNewBreaks(draft, session.businessDate, timezone);

    try {
      if (narrowing) {
        await applyBreaks();
        await applySession();
      } else {
        await applySession();
        await applyBreaks();
      }
      // Last, so they are checked against the session and breaks as corrected.
      for (const { id, span } of newBreaks) {
        const saved = await addBreak.mutateAsync({ sessionId: session.id, span });
        // A later request can still fail, and a retry must not add this one twice.
        rows.markSaved(id, savedBreakId(saved, span) ?? id);
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

  const markAsChecked = async () => {
    setFailure(null);
    try {
      await markChecked.mutateAsync(session.id);
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
      {entered || changed ? (
        <div className="flex flex-wrap items-center gap-2">
          {entered ? (
            <EnteredMark
              label={created?.user ? t.corrections.enteredBy(created.user.name) : undefined}
            />
          ) : null}
          {changed ? (
            <ChangedMark
              label={adminReviewing && personName ? t.corrections.changedBy(personName) : undefined}
            />
          ) : null}
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`in-${session.id}`}>
            {entered ? t.corrections.start : t.corrections.clockIn}
          </Label>
          <Input
            id={`in-${session.id}`}
            type="time"
            value={draft.startedAt}
            onChange={(event) => setTimes({ ...times, startedAt: event.target.value })}
          />
          <FieldError message={fieldMessage(errors.startedAt)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`out-${session.id}`}>
            {entered ? t.corrections.end : t.corrections.clockOut}
          </Label>
          <Input
            id={`out-${session.id}`}
            type="time"
            value={draft.endedAt}
            onChange={(event) => setTimes({ ...times, endedAt: event.target.value })}
          />
          <FieldError message={fieldMessage(errors.endedAt)} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {session.endedAt === null
              ? t.corrections.stillOpenHint
              : swept
                ? t.corrections.wasSwept(formatClockTime(session.endedAt, timezone))
                : t.corrections.was(formatClockTime(session.endedAt, timezone))}
          </span>
        </div>
      </div>

      <BreakRows
        breaks={draft.breaks}
        messageFor={(id) => breakMessage(id, errors, draft, t)}
        onChange={rows.change}
        onRemove={(entry) => (entry.isNew ? rows.remove(entry.id) : void drop(entry.id))}
        // A running session takes its breaks from the clock.
        onAdd={session.endedAt !== null ? rows.add : undefined}
        disabled={saving}
      />

      <History sessionId={session.id} timezone={timezone} />

      {adminReviewing ? (
        <ChangedNotice>
          {t.corrections.changedByNotice(personName ?? t.corrections.theEmployee)}
        </ChangedNotice>
      ) : null}
      {flagsOnSave ? <ChangedNotice>{t.corrections.pastDayNotice}</ChangedNotice> : null}

      {failure ? (
        <p className="text-sm" style={{ color: "var(--destructive)" }} role="alert">
          {failure}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {!deletable ? (
          <span className="max-w-64 text-xs" style={{ color: "var(--text-muted)" }}>
            {entered ? t.corrections.enteredByAdminHint : t.corrections.clockedEarlierHint}
          </span>
        ) : confirming ? (
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

        <span className="flex flex-wrap items-center gap-2">
          {adminReviewing ? (
            <Button
              type="button"
              variant="outline"
              disabled={saving || edited}
              onClick={() => void markAsChecked()}
            >
              <Check />
              {markChecked.isPending ? t.corrections.markingChecked : t.corrections.markChecked}
            </Button>
          ) : null}
          <Button type="button" disabled={invalid || saving} onClick={() => void save()}>
            {saving && !markChecked.isPending ? t.corrections.saving : t.corrections.save}
          </Button>
        </span>
      </div>

      {adminReviewing && edited ? (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {t.corrections.markCheckedEditedHint}
        </p>
      ) : null}

      {ownDay && enteredByOwner && session.businessDate !== ownDay.today ? (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {t.corrections.enteredDeleteHint}
        </p>
      ) : null}
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
 * Who may actually save is the backend's call; the screens only open it on a
 * day the reader may change. On the reader's own day, `ownDay` hides the delete
 * a clocked session from an earlier day would be refused, and says until when
 * the day stays theirs.
 */
export function CorrectionDialog({
  organizationId,
  userId,
  personName,
  businessDate,
  ownDay,
  open,
  onOpenChange,
  onAddSession,
}: {
  organizationId: string;
  /** Somebody else's day, for an admin; null for the reader's own. */
  userId?: string | null;
  personName?: string;
  businessDate: string;
  /** The reader's own day, under the organization's self-service window. */
  ownDay?: { today: string; selfService: SelfServiceWindow; administersOwn?: boolean };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSession?: () => void;
}) {
  const { t, locale } = useTranslation();
  const query = useAttendanceDay(open ? { organizationId, businessDate, userId } : null, open);

  const day = formatBusinessDay(businessDate, locale);

  const timezone = query.data?.timezone ?? null;
  const sessions = query.data?.sessions ?? [];
  // Decided per session, as the API does: a day outside the window can still
  // hold a session left open, and only that one is the reader's to change.
  const editable = ownDay
    ? sessions.filter(
        (session) =>
          selfServiceVerdict({
            window: ownDay.selfService,
            businessDate: session.businessDate,
            today: ownDay.today,
            open: session.open,
            employmentEnded: false,
          }) === "OPEN"
      )
    : sessions;

  const description = (() => {
    if (personName) return personName;
    if (!ownDay) return "";
    const until = correctableUntil(businessDate, ownDay.selfService.days);
    if (until === null || until < ownDay.today) return t.corrections.ownDay;
    if (until === ownDay.today) return t.corrections.ownDayUntilMidnight;
    return t.corrections.ownDayUntil(formatBusinessDay(until, locale));
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="capitalize">{t.corrections.title(day)}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
            {editable.length < sessions.length ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {t.corrections.outsideWindowLeftOut}
              </p>
            ) : null}
            {editable.map((session) => (
              <SessionCorrection
                // The draft is derived from the row, so a saved change comes
                // back as a new component rather than as state to reconcile.
                key={`${session.id}:${session.startedAt}:${session.endedAt ?? "open"}:${session.breaks
                  .map((entry) => `${entry.id}${entry.startedAt}${entry.endedAt ?? ""}`)
                  .join(",")}`}
                session={session}
                timezone={timezone}
                personName={personName}
                ownDay={
                  ownDay && query.data
                    ? {
                        today: ownDay.today,
                        userId: query.data.userId,
                        administersOwn: ownDay.administersOwn ?? false,
                      }
                    : undefined
                }
                onDone={() => onOpenChange(false)}
              />
            ))}
          </div>
        )}

        {onAddSession && !query.isPending && !query.error ? (
          <div>
            <Button type="button" size="sm" variant="ghost" onClick={onAddSession}>
              <CalendarPlus />
              {t.corrections.addAnother}
            </Button>
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t.corrections.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
