"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  decideAssistantCard,
  type AllowanceChange,
  type BalanceChange,
  type CardDecision,
  type CardPreview,
  type PendingCard,
} from "@/lib/api/assistant";
import { CALENDAR_RECORD_TYPE_COLORS, type WireRecordType } from "@/lib/api/types";
import { recordTypeLabel } from "@/lib/i18n/record-type-label";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

type Translations = ReturnType<typeof useTranslation>["t"];
type Copy = Translations["assistant"]["cards"];

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-[14px]">
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-right tabular-nums">{children}</span>
    </div>
  );
}

function TypeDot({ type }: { type: string }) {
  const { t } = useTranslation();
  // The type's text colour, light and dark, painted as the dot.
  const colors = (CALENDAR_RECORD_TYPE_COLORS[type as WireRecordType] ?? "")
    .split(" ")
    .filter((name) => name.includes("text-"))
    .join(" ");
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className={cn(colors, "size-2 rounded-full bg-current")} />
      {recordTypeLabel(t.calendarRecordTypes, type as WireRecordType)}
    </span>
  );
}

/** Text someone wrote, shown word for word under whose words they are. */
function Quoted({ who, text }: { who: string; text: string }) {
  return (
    <div
      className="mt-2 rounded-[var(--radius-sm)] px-3 py-2.5"
      style={{ background: "var(--surface-2)" }}
    >
      <div className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>
        {who}
      </div>
      <div className="mt-0.5 text-[14px] leading-[1.5] whitespace-pre-line">“{text}”</div>
    </div>
  );
}

const dayFormat = (locale: string) =>
  new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

function dates(locale: string, first: string, last: string): string {
  const format = dayFormat(locale);
  const day = (iso: string) => format.format(new Date(`${iso}T00:00:00Z`));
  return first === last ? day(first) : `${day(first)} – ${day(last)}`;
}

/** The clock time of an instant in the attendance time zone, as the record shows it. */
function clockTime(locale: string, iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", timeZone }).format(
    new Date(iso)
  );
}

const number = (locale: string, value: number) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);

function names(copy: Copy, list: string[]): string {
  if (list.length <= 1) return list.join("");
  return `${list.slice(0, -1).join(", ")} ${copy.and} ${list.at(-1)}`;
}

function Balance({
  allowances,
  locale,
  copy,
}: {
  allowances: AllowanceChange[];
  locale: string;
  copy: Copy;
}) {
  return allowances.map((allowance) => (
    <Row
      key={`${allowance.year}-${allowance.type}`}
      label={allowances.length > 1 ? copy.rows.balanceIn(allowance.year) : copy.rows.balance}
    >
      <span style={{ color: "var(--text-muted)" }}>
        {number(locale, allowance.availableBefore)} →{" "}
      </span>
      {number(locale, allowance.availableAfter)}
    </Row>
  ));
}

/** The requester's balance as the app shows it; a decision that leaves it alone shows one number. */
function RemainingBalance({
  balances,
  locale,
  copy,
}: {
  balances: BalanceChange[];
  locale: string;
  copy: Copy;
}) {
  return balances.map((balance) => (
    <Row
      key={`${balance.year}-${balance.type}`}
      label={balances.length > 1 ? copy.rows.balanceIn(balance.year) : copy.rows.balance}
    >
      {balance.remainingBefore === balance.remainingAfter ? (
        number(locale, balance.remainingAfter)
      ) : (
        <>
          <span style={{ color: "var(--text-muted)" }}>
            {number(locale, balance.remainingBefore)} →{" "}
          </span>
          {number(locale, balance.remainingAfter)}
        </>
      )}
    </Row>
  ));
}

function Details({ preview, locale, copy }: { preview: CardPreview; locale: string; copy: Copy }) {
  switch (preview.action) {
    case "create_request":
      return (
        <>
          <Row label={copy.rows.type}>
            <TypeDot type={preview.type} />
          </Row>
          <Row label={copy.rows.dates}>
            {dates(locale, preview.firstDay, preview.lastDay)}
            {preview.halfDay ? `, ${copy.halfDay}` : ""}
          </Row>
          <Row label={copy.rows.workingDays}>{number(locale, preview.days)}</Row>
          <Balance allowances={preview.allowances} locale={locale} copy={copy} />
          <Row label={copy.rows.group}>{preview.group.name}</Row>
          {preview.note ? <Quoted who={copy.yourNote} text={preview.note} /> : null}
        </>
      );
    case "cancel_my_request":
      return (
        <>
          <Row label={copy.rows.type}>
            <TypeDot type={preview.type} />
          </Row>
          <Row label={copy.rows.dates}>{dates(locale, preview.firstDay, preview.lastDay)}</Row>
          <Row label={copy.rows.status}>{copy.statuses[preview.status]}</Row>
          <Row label={copy.rows.workingDays}>{number(locale, preview.days)}</Row>
          <Balance allowances={preview.allowances} locale={locale} copy={copy} />
          {preview.note ? <Quoted who={copy.requestNote} text={preview.note} /> : null}
          {preview.reason ? <Quoted who={copy.yourReason} text={preview.reason} /> : null}
        </>
      );
    case "approve_request":
    case "reject_request":
      return (
        <>
          <Row label={copy.rows.requester}>{preview.requester.name}</Row>
          <Row label={copy.rows.type}>
            <TypeDot type={preview.type} />
          </Row>
          <Row label={copy.rows.dates}>{dates(locale, preview.firstDay, preview.lastDay)}</Row>
          <Row label={copy.rows.workingDays}>{number(locale, preview.days)}</Row>
          <RemainingBalance balances={preview.balances} locale={locale} copy={copy} />
          <Row label={copy.rows.group}>{preview.group.name}</Row>
          {preview.note ? (
            <Quoted
              who={copy.noteBy(preview.noteAuthor ?? preview.requester.name)}
              text={preview.note}
            />
          ) : null}
        </>
      );
    case "clock_in":
      return <Row label={copy.rows.time}>{clockTime(locale, preview.at, preview.timezone)}</Row>;
    case "clock_out": {
      const hours = Math.floor(preview.sessionMinutes / 60);
      const minutes = preview.sessionMinutes % 60;
      return (
        <>
          <Row label={copy.rows.started}>
            {clockTime(locale, preview.startedAt, preview.timezone)}
          </Row>
          <Row
            label={copy.rows.workedSoFar}
          >{`${hours} h ${String(minutes).padStart(2, "0")} m`}</Row>
          {preview.onBreak ? (
            <p className="pt-1 text-[13.5px]" style={{ color: "var(--text-muted)" }}>
              {copy.onBreak}
            </p>
          ) : null}
        </>
      );
    }
  }
}

/** The one line a settled card collapses to. */
function settledText(card: PendingCard, locale: string, copy: Copy): string {
  const { preview } = card;
  const time = (key: string) => {
    const value = card.result?.[key];
    const zone = "timezone" in preview ? preview.timezone : "UTC";
    return typeof value === "string" ? clockTime(locale, value, zone) : "";
  };
  switch (preview.action) {
    case "create_request":
      return copy.settled.create_request;
    case "cancel_my_request":
      return copy.settled.cancel_my_request;
    case "clock_in":
      return copy.settled.clock_in(time("startedAt"));
    case "clock_out":
      return copy.settled.clock_out(time("endedAt"));
    case "approve_request":
    case "reject_request":
      return copy.settled[preview.action](preview.requester.name);
  }
}

function summary(card: PendingCard, locale: string, copy: Copy, t: Translations): string {
  const { preview } = card;
  if (preview.action === "create_request" || preview.action === "cancel_my_request") {
    const type = recordTypeLabel(t.calendarRecordTypes, preview.type as WireRecordType);
    return `${type}, ${dates(locale, preview.firstDay, preview.lastDay)}`;
  }
  if (preview.action === "approve_request" || preview.action === "reject_request") {
    const type = recordTypeLabel(t.calendarRecordTypes, preview.type as WireRecordType);
    return `${preview.requester.name}, ${type}, ${dates(locale, preview.firstDay, preview.lastDay)}`;
  }
  return copy.confirm[preview.action];
}

const OPEN_HREF: Record<PendingCard["tool"], string> = {
  create_request: "/requests",
  cancel_my_request: "/requests",
  clock_in: "/my-attendance",
  clock_out: "/my-attendance",
  approve_request: "/requests",
  reject_request: "/requests",
};

/**
 * A confirmation card for one write the Assistant asked for. Everything on it
 * comes from the write's preview, never the model. Nothing changes until the
 * user confirms; "Not now" ("Keep it" on a cancel) leaves everything as it was.
 */
export function ConfirmCard({
  card,
  onDecided,
}: {
  card: PendingCard;
  onDecided?: (decision: CardDecision) => void;
}) {
  const { t } = useTranslation();
  const copy = t.assistant.cards;
  const locale = t.common.dateLocale;
  const [current, setCurrent] = useState(card);
  // A newer card from the server (a refetch) replaces what this one last showed.
  const [seen, setSeen] = useState(card);
  if (card !== seen) {
    setSeen(card);
    setCurrent(card);
  }
  const [reason, setReason] = useState(
    card.preview.action === "reject_request" ? (card.preview.reason ?? "") : ""
  );
  const reasonId = useId();
  const decide = useMutation({
    mutationFn: (decision: "confirm" | "decline") =>
      decision === "confirm" && current.tool === "reject_request"
        ? decideAssistantCard(current.id, decision, reason)
        : decideAssistantCard(current.id, decision),
    onSuccess: (decision) => {
      setCurrent(decision.card);
      onDecided?.(decision);
    },
  });

  const status = current.status;
  if (status !== "open") {
    const confirmed = status === "confirmed";
    const tail = confirmed
      ? settledText(current, locale, copy)
      : status === "declined"
        ? copy.declined
        : copy.notTaken;
    return (
      <div
        data-testid="assistant-card"
        data-status={status}
        className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border px-3.5 py-2.5 text-[14px]"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="flex items-center gap-2">
          {confirmed ? (
            <Check aria-hidden className="size-4 shrink-0" style={{ color: "var(--ok)" }} />
          ) : null}
          <span>
            <span className="font-medium">{summary(current, locale, copy, t)}</span>
            <span style={{ color: "var(--text-muted)" }}> · {tail}</span>
          </span>
        </span>
        {confirmed ? (
          <Link
            href={OPEN_HREF[current.tool]}
            className="shrink-0 text-[13px] font-semibold underline-offset-2 hover:underline"
            style={{ color: "var(--primary-strong)" }}
          >
            {copy.open}
          </Link>
        ) : null}
      </div>
    );
  }

  const working = decide.isPending;
  const error = current.error?.message ?? (decide.isError ? copy.decideFailed : null);
  const isCancel = current.tool === "cancel_my_request";
  const { preview } = current;

  return (
    <div
      data-testid="assistant-card"
      data-status={error ? "failed" : "open"}
      role="group"
      aria-label={copy.title[current.tool]}
      className="rounded-[var(--radius-lg)] border px-4 pt-3.5 pb-4"
      style={{ borderColor: "var(--border-strong)", background: "var(--surface)" }}
    >
      <div className="text-[15px] font-semibold">{copy.title[current.tool]}</div>
      {current.authorNames.length > 0 ? (
        <p
          role="note"
          className="mt-2 rounded-[var(--radius-sm)] px-3 py-2 text-[13.5px] leading-[1.5]"
          style={{ background: "var(--warning-soft, var(--surface-2))" }}
        >
          {copy.marker(names(copy, current.authorNames))}
        </p>
      ) : null}
      <div className="mt-2">
        <Details preview={preview} locale={locale} copy={copy} />
      </div>
      {preview.action === "reject_request" ? (
        <div className="mt-3 grid gap-1.5">
          <Label htmlFor={reasonId} className="text-[13px] font-normal">
            {copy.reasonFor(preview.requester.name)}
          </Label>
          <Textarea
            id={reasonId}
            value={reason}
            maxLength={1000}
            rows={2}
            disabled={working}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
      ) : null}
      {error ? (
        <div
          role="alert"
          className="mt-3 text-[13.5px] leading-[1.5]"
          style={{ color: "var(--danger)" }}
        >
          {error}
        </div>
      ) : null}
      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={isCancel || current.tool === "reject_request" ? "destructive" : "default"}
          disabled={working}
          onClick={() => decide.mutate("confirm")}
        >
          {working ? <Loader2 className="animate-spin" /> : null}
          {error ? copy.tryAgain : copy.confirm[current.tool]}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={working}
          onClick={() => decide.mutate("decline")}
        >
          {isCancel ? copy.keepIt : copy.notNow}
        </Button>
        <span className="ml-auto text-[12.5px]" style={{ color: "var(--text-faint)" }}>
          {copy.madeThrough}
        </span>
      </div>
    </div>
  );
}
