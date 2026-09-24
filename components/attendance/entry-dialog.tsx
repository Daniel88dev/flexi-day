"use client";

import { useState } from "react";
import { CalendarPlus, Moon } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/client";
import { useAttendanceDay, useEnterSession } from "@/lib/api/queries";
import { formatMinutes } from "@/lib/attendance/duration";
import {
  entryBreaks,
  entryErrors,
  entryFigures,
  entrySpan,
  type BreakRules,
  type EntryDraft,
  type EntryError,
} from "@/lib/attendance/entry";
import { addDays } from "@/lib/attendance/month";
import {
  selfServiceMode,
  windowStart,
  type SelfServiceWindow,
} from "@/lib/attendance/self-service";
import type { KnownSpell } from "@/lib/attendance/team";
import { formatBusinessDay, formatBusinessWeekday } from "@/lib/attendance/today";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Dictionary } from "@/lib/i18n";
import { BreakRows, breakMessage, useBreakDrafts } from "./break-rows";

function refusalMessage(error: unknown, t: Dictionary): string {
  if (!(error instanceof ApiError)) return t.entry.failed;

  const context = error.context<{ reason?: string; ceilingMinutes?: number }>();
  if (context?.reason === "OVER_CEILING" && typeof context.ceilingMinutes === "number") {
    return t.entry.overCeiling(formatMinutes(context.ceilingMinutes));
  }

  const wording: Record<string, string> = t.corrections.errors;
  return (context?.reason ? wording[context.reason] : undefined) ?? error.message ?? t.entry.failed;
}

const dayAndMonth = (businessDate: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${businessDate}T12:00:00Z`)
  );

type Props = {
  organizationId: string;
  /** The day the reader was looking at; the form opens on it. */
  businessDate: string;
  /** Today in the organization's zone. */
  today: string;
  timezone: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The reader's own day, under the organization's self-service window. */
  selfService?: SelfServiceWindow;
  /** Somebody else's day, for an admin, who never meets the window. Set this or `selfService`. */
  person?: { userId: string; name: string; spell?: KnownSpell };
  /** For the figures under the breaks. Without them there are none. */
  rules?: BreakRules;
};

function EntryForm({
  organizationId,
  businessDate,
  today,
  timezone,
  person,
  selfService,
  rules,
  onOpenChange,
}: Omit<Props, "open">) {
  const { t, locale } = useTranslation();
  const [fields, setFields] = useState<Omit<EntryDraft, "breaks">>({
    businessDate,
    startedAt: "",
    endedAt: "",
    nextDay: false,
  });
  const rows = useBreakDrafts();
  const draft: EntryDraft = { ...fields, breaks: rows.breaks };
  const [failure, setFailure] = useState<string | null>(null);
  const enter = useEnterSession();

  const dayQuery = useAttendanceDay(
    draft.businessDate
      ? { organizationId, businessDate: draft.businessDate, userId: person?.userId }
      : null,
    draft.businessDate !== ""
  );

  const earliest = selfService ? windowStart(today, selfService.days) : null;
  const errors = entryErrors(draft, {
    timezone,
    now: new Date(),
    today,
    earliest,
    sessions: dayQuery.data?.sessions ?? [],
    spell: person?.spell,
  });
  const invalid = Boolean(
    errors.businessDate ?? errors.startedAt ?? errors.endedAt ?? errors.breaks
  );
  const figures = rules
    ? entryFigures(draft, { timezone, sessions: dayQuery.data?.sessions ?? [], rules })
    : null;

  const hint = (() => {
    if (person || !selfService) return t.entry.hintAdmin(person?.name ?? "");
    const mode = selfServiceMode(selfService);
    if (mode === "NO_LIMIT") return t.entry.hintNoLimit;
    if (mode === "DAYS") return t.entry.hintDays(selfService.days ?? 0);
    return t.entry.hintToday;
  })();

  const message = (error: EntryError | undefined): string | null => {
    if (!error) return null;
    switch (error.kind) {
      // Every field starts empty, so "needs a time" would greet the reader
      // before they have typed anything. Save stays disabled instead.
      case "REQUIRED":
        return null;
      case "OUTSIDE_WINDOW":
        return t.entry.errors.OUTSIDE_WINDOW;
      case "FUTURE_DATE":
        return t.entry.errors.FUTURE_DATE;
      case "BEFORE_EMPLOYMENT":
        return t.entry.errors.employmentBegan(person?.name ?? "", dayAndMonth(error.began, locale));
      case "AFTER_EMPLOYMENT":
        return t.entry.errors.employmentEnded(person?.name ?? "", dayAndMonth(error.ended, locale));
      case "END_BEFORE_START":
        return t.entry.errors.END_BEFORE_START;
      case "END_IN_FUTURE":
        return t.entry.errors.endInFuture(error.now);
      case "OVERLAPS":
        if (error.to === null) {
          return person
            ? t.entry.errors.overlapsOpenTheirs(error.from)
            : t.entry.errors.overlapsOpenOwn(error.from);
        }
        return person
          ? t.entry.errors.overlapsTheirs(error.from, error.to)
          : t.entry.errors.overlapsOwn(error.from, error.to);
    }
  };

  const messages = [errors.businessDate, errors.startedAt, errors.endedAt]
    .map(message)
    .filter((text): text is string => text !== null);

  const save = async () => {
    const span = entrySpan(draft, timezone);
    if (invalid || span.startedAt === null || span.endedAt === null) return;
    setFailure(null);
    const breaks = entryBreaks(draft, timezone);
    try {
      await enter.mutateAsync({
        organizationId,
        userId: person?.userId,
        businessDate: draft.businessDate,
        startedAt: span.startedAt,
        endedAt: span.endedAt,
        ...(breaks.length > 0 ? { breaks } : {}),
      });
      onOpenChange(false);
    } catch (error) {
      setFailure(refusalMessage(error, t));
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{person ? t.entry.titleFor(person.name) : t.entry.title}</DialogTitle>
        <DialogDescription>
          {person ? t.entry.adminDescription : t.entry.ownDescription}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        {person ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{t.entry.person}</span>
            <span
              className="rounded-full border px-3 py-1.5 text-sm"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              {person.name}
            </span>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr] sm:items-start">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entry-date">{t.entry.date}</Label>
            <Input
              id="entry-date"
              type="date"
              value={draft.businessDate}
              min={earliest ?? undefined}
              max={today}
              aria-invalid={
                errors.businessDate !== undefined && errors.businessDate.kind !== "REQUIRED"
              }
              onChange={(event) => setFields({ ...fields, businessDate: event.target.value })}
            />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {hint}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entry-start">{t.entry.start}</Label>
            <Input
              id="entry-start"
              type="time"
              value={draft.startedAt}
              aria-invalid={errors.startedAt !== undefined && errors.startedAt.kind !== "REQUIRED"}
              onChange={(event) => setFields({ ...fields, startedAt: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entry-end">{t.entry.end}</Label>
            <Input
              id="entry-end"
              type="time"
              value={draft.endedAt}
              aria-invalid={errors.endedAt !== undefined && errors.endedAt.kind !== "REQUIRED"}
              onChange={(event) => setFields({ ...fields, endedAt: event.target.value })}
            />
          </div>
        </div>

        {/* The fields are too narrow for a sentence, so their errors run the
            full width under the row, in field order. */}
        {messages.map((text) => (
          <span key={text} className="-mt-2 text-xs" style={{ color: "var(--destructive)" }}>
            {text}
          </span>
        ))}

        <div className="flex flex-wrap items-center gap-2.5">
          <Switch
            id="entry-next-day"
            checked={draft.nextDay}
            onCheckedChange={(nextDay) => setFields({ ...fields, nextDay })}
          />
          <Label htmlFor="entry-next-day">{t.entry.nextDay}</Label>
          {draft.nextDay && draft.businessDate ? (
            <span
              className="flex items-center gap-1 text-xs [&_svg]:size-3"
              style={{ color: "var(--text-muted)" }}
            >
              <Moon aria-hidden />
              {t.entry.nextDayHint(
                formatBusinessDay(addDays(draft.businessDate, 1), locale),
                formatBusinessWeekday(draft.businessDate, locale)
              )}
            </span>
          ) : null}
        </div>

        <BreakRows
          breaks={draft.breaks}
          messageFor={(id) => breakMessage(id, errors, draft, t)}
          onChange={rows.change}
          onRemove={(entry) => rows.remove(entry.id)}
          onAdd={rows.add}
          tagNew={false}
          optional
        />

        {figures ? (
          <div
            className="flex flex-wrap gap-x-[18px] gap-y-1 rounded-xl px-3.5 py-2.5 text-[13px]"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
            data-testid="entry-summary"
          >
            <span>
              {t.entry.presence}{" "}
              <b className="tabular-nums" style={{ color: "var(--text)" }}>
                {formatMinutes(figures.presenceMinutes)}
              </b>
            </span>
            <span>
              {t.entry.breaks}{" "}
              <b className="tabular-nums" style={{ color: "var(--text)" }}>
                {formatMinutes(figures.breaksMinutes)}
              </b>
            </span>
            <span>
              {t.entry.worked}{" "}
              <b className="tabular-nums" style={{ color: "var(--text)" }}>
                {formatMinutes(figures.workedMinutes)}
              </b>
            </span>
          </div>
        ) : null}

        {failure ? (
          <p className="text-sm" style={{ color: "var(--destructive)" }} role="alert">
            {failure}
          </p>
        ) : null}
      </div>

      <DialogFooter className="items-center sm:justify-between">
        <span className="max-w-72 text-xs" style={{ color: "var(--text-muted)" }}>
          {person ? t.entry.adminNote(person.name) : t.entry.ownNote}
        </span>
        <span className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t.entry.cancel}
          </Button>
          <Button type="button" disabled={invalid || enter.isPending} onClick={() => void save()}>
            <CalendarPlus />
            {enter.isPending ? t.entry.saving : t.entry.submit}
          </Button>
        </span>
      </DialogFooter>
    </>
  );
}

export function EntryDialog({ open, onOpenChange, ...props }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        {/* Mounted with the content, so every opening starts from a fresh form. */}
        {open ? <EntryForm {...props} onOpenChange={onOpenChange} /> : null}
      </DialogContent>
    </Dialog>
  );
}
