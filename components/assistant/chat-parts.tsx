"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUp, Check, ChevronDown, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/api/ai-settings";
import { aiUsageHref } from "@/lib/api/ai-usage";
import {
  chatGroup,
  weeklyResetLabel,
  type AssistantChat,
  type AssistantOrganization,
  type CardDecision,
  type DisplayMessage,
  type WeeklyLimitState,
} from "@/lib/api/assistant";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";
import { ConfirmCard } from "./confirm-card";
import { RichText } from "./rich-text";
import type { FailedSend, LiveTool, LiveTurn } from "./use-assistant-turn";

type Translations = ReturnType<typeof useTranslation>["t"];
type Copy = Translations["assistant"];
type ToolName = Exclude<keyof Copy["tools"], "other">;

/** A tool line whose result the Weekly limit kept from being sent; the notice after it says why. */
const TOOL_STOPPED = "stopped";

export function toolLine(copy: Copy, name: string | null, status: LiveTool["status"]): string {
  const forms = name && name in copy.tools ? copy.tools[name as ToolName] : copy.tools.other;
  return forms[status];
}

/** The fixed words of a notice the backend records or streams by code; never model output. */
export function noticeText(t: Translations, code: string | null, organizationName: string): string {
  if (code === "ASSISTANT_WEEKLY_LIMIT_REACHED") return t.assistant.limit.stopped(organizationName);
  const fixed: Record<string, string> = { ...t.assistant.notices, ...t.assistantBoundary.notices };
  return (code ? fixed[code] : undefined) ?? t.assistant.notices.ASSISTANT_ERROR;
}

/** A user row the screen rejected: the message never reached the Assistant. */
const REJECTED = "REJECTED";

/** Codes of a failed send that a plain resend can fix. */
const RESENDABLE = new Set([null, "ASSISTANT_SCREEN_FAILED", "ASSISTANT_TURN_RUNNING"]);

/* ---------------------------------------------------------------- messages */

function UserBubble({
  text,
  error,
  rejected,
  retry,
}: {
  text: string;
  error?: string | null;
  rejected?: boolean;
  retry?: { label: string; onClick: () => void } | null;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-end gap-1">
      <div
        className={cn(
          "max-w-[85%] rounded-[18px] rounded-br-[6px] px-3.5 py-2.5 text-[15px] leading-[1.5] whitespace-pre-line",
          rejected && "opacity-60"
        )}
        style={{ background: "var(--surface-2)" }}
      >
        {text}
      </div>
      {rejected ? (
        <div className="text-[12.5px]" style={{ color: "var(--text-faint)" }}>
          {t.assistantBoundary.rejected}
        </div>
      ) : null}
      {error ? (
        <div role="alert" className="text-right text-[13px]" style={{ color: "var(--danger)" }}>
          {error}
        </div>
      ) : null}
      {retry ? (
        <Button size="xs" variant="outline" onClick={retry.onClick}>
          {retry.label}
        </Button>
      ) : null}
    </div>
  );
}

function Steps({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <div
      data-testid="assistant-steps"
      className="mb-1.5 text-[12.5px]"
      style={{ color: "var(--text-faint)" }}
    >
      {lines.join(" · ")}
    </div>
  );
}

function StatusLine({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-center gap-2 text-[13.5px]"
      style={{ color: "var(--text-muted)" }}
    >
      <Loader2 className="size-3.5 animate-spin" aria-hidden />
      {children}
    </div>
  );
}

function Notice({ text }: { text: string }) {
  return (
    <div className="text-[15px] leading-[1.6]" style={{ color: "var(--text-muted)" }}>
      {text}
    </div>
  );
}

function LiveTurnView({
  turn,
  organizationName,
  onCardDecided,
}: {
  turn: LiveTurn;
  organizationName: string;
  onCardDecided?: (decision: CardDecision) => void;
}) {
  const { t } = useTranslation();
  const copy = t.assistant;
  // A write's tool line becomes its card.
  const carded = new Set(turn.cards.map((card) => card.toolUseId));
  const tools = turn.tools.filter((tool) => !carded.has(tool.eventId));
  const done = tools.filter((tool) => tool.status !== "running");
  const running = tools.find((tool) => tool.status === "running");
  const written = [...turn.texts, turn.partial].filter((text) => text.length > 0).join("\n\n");
  return (
    <div>
      <Steps lines={done.map((tool) => toolLine(copy, tool.name, tool.status))} />
      {written ? <RichText text={written} /> : null}
      {turn.partial ? (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-4 w-[3px] translate-y-0.5 animate-pulse rounded-full"
          style={{ background: "var(--primary)" }}
        />
      ) : null}
      {turn.cards.length > 0 ? (
        <div className="mt-3 space-y-3">
          {turn.cards.map((card) => (
            <ConfirmCard key={card.id} card={card} onDecided={onCardDecided} />
          ))}
        </div>
      ) : null}
      {turn.notice ? <Notice text={noticeText(t, turn.notice, organizationName)} /> : null}
      {turn.phase === "reconnecting" ? (
        <StatusLine>{copy.stillWriting}</StatusLine>
      ) : running ? (
        <StatusLine>{toolLine(copy, running.name, "running")}</StatusLine>
      ) : !written && turn.cards.length === 0 ? (
        <StatusLine>{copy.thinking}</StatusLine>
      ) : null}
    </div>
  );
}

/**
 * The display record and the answer being written. Tool lines gather into the
 * step line above the Assistant text that follows them.
 */
export function MessageList({
  messages,
  live,
  failed,
  onResend,
  onCardDecided,
  organizationName,
}: {
  messages: DisplayMessage[];
  live: LiveTurn | null;
  failed: FailedSend | null;
  /** Sends a message that wasn't sent again, as it was. */
  onResend?: (text: string) => void;
  /** A card was confirmed or declined; the Assistant may write on. */
  onCardDecided?: (decision: CardDecision) => void;
  organizationName: string;
}) {
  const { t } = useTranslation();
  const copy = t.assistant;
  const rows: ReactNode[] = [];
  let steps: string[] = [];
  const flushSteps = (key: string) => {
    if (steps.length > 0) rows.push(<Steps key={key} lines={steps} />);
    steps = [];
  };

  for (const message of messages) {
    if (message.kind === "tool" && message.card) {
      flushSteps(`steps-${message.id}`);
      rows.push(<ConfirmCard key={message.id} card={message.card} onDecided={onCardDecided} />);
      continue;
    }
    if (message.kind === "tool") {
      if (message.toolOutcome === TOOL_STOPPED) continue;
      const status = message.toolOutcome && message.toolOutcome !== "ok" ? "failed" : "done";
      steps.push(toolLine(copy, message.toolName, status));
      continue;
    }
    if (message.kind === "assistant") {
      rows.push(
        <div key={message.id}>
          <Steps lines={steps} />
          <RichText text={message.text ?? ""} />
        </div>
      );
      steps = [];
      continue;
    }
    flushSteps(`steps-${message.id}`);
    if (message.kind === "user") {
      rows.push(
        <UserBubble
          key={message.id}
          text={message.text ?? ""}
          rejected={message.code === REJECTED}
        />
      );
    } else {
      rows.push(<Notice key={message.id} text={noticeText(t, message.code, organizationName)} />);
    }
  }
  flushSteps("steps-end");

  const sendErrors: Record<string, string> = {
    ...copy.sendErrors,
    ASSISTANT_SCREEN_FAILED: t.assistantBoundary.screenFailed,
    ASSISTANT_UNAVAILABLE: t.assistantBoundary.unavailable,
  };
  const sendError = failed
    ? ((failed.code ? sendErrors[failed.code] : undefined) ?? copy.sendErrors.fallback)
    : null;
  const retry =
    failed && onResend && RESENDABLE.has(failed.code)
      ? {
          label:
            failed.code === "ASSISTANT_SCREEN_FAILED"
              ? t.assistantBoundary.tryAgain
              : t.assistantBoundary.sendAgain,
          onClick: () => onResend(failed.text),
        }
      : null;

  // A chat created by this message may already list it.
  const lastMessage = messages.at(-1);

  return (
    <div className="space-y-5">
      {rows}
      {live?.userText && !(lastMessage?.kind === "user" && lastMessage.text === live.userText) ? (
        <UserBubble text={live.userText} />
      ) : null}
      {live ? (
        <LiveTurnView
          turn={live}
          organizationName={organizationName}
          onCardDecided={onCardDecided}
        />
      ) : null}
      {failed ? <UserBubble text={failed.text} error={sendError} retry={retry} /> : null}
    </div>
  );
}

/* ---------------------------------------------------------------- composer */

export function Composer({ busy, onSend }: { busy: boolean; onSend: (text: string) => void }) {
  const { t } = useTranslation();
  const copy = t.assistant;
  const [text, setText] = useState("");

  function submit() {
    const value = text.trim();
    if (!value || busy) return;
    onSend(value);
    setText("");
  }

  return (
    <div className="space-y-2">
      <div
        className="flex items-end gap-2 rounded-[22px] border px-2 py-2 transition-colors focus-within:border-[color:var(--primary)]"
        style={{ borderColor: "var(--border-strong)", background: "var(--surface)" }}
      >
        <textarea
          aria-label={copy.composer.label}
          rows={1}
          value={text}
          disabled={busy}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={copy.composer.label}
          maxLength={4000}
          className="[field-sizing:content] max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] leading-[1.5] outline-none placeholder:text-[color:var(--text-faint)] disabled:opacity-60"
        />
        <button
          type="button"
          aria-label={copy.composer.send}
          onClick={submit}
          disabled={!text.trim() || busy}
          className="grid size-9 shrink-0 place-items-center rounded-full transition-opacity disabled:opacity-35"
          style={{ background: "var(--primary)", color: "var(--primary-fg)" }}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <ArrowUp className="size-4" aria-hidden />
          )}
        </button>
      </div>
      <p className="px-2 text-[12.5px]" style={{ color: "var(--text-faint)" }}>
        {copy.aiLine}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- Weekly limit */

/**
 * From 80% of the Weekly limit, under the composer: a bar at the true ratio and
 * the reset in the viewer's time zone. Owners and org admins also see the
 * amounts; members see the percentage only.
 */
export function NearLimit({
  organizationName,
  limit,
}: {
  organizationName: string;
  limit: WeeklyLimitState;
}) {
  const { t, locale } = useTranslation();
  const copy = t.assistant.limit;
  const reset = weeklyResetLabel(limit.resetsAt, t.common.dateLocale);
  const text =
    limit.usedMicroUsd !== null && limit.limitMicroUsd !== null
      ? copy.nearAmounts(
          organizationName,
          formatUsd(locale, limit.usedMicroUsd),
          formatUsd(locale, limit.limitMicroUsd),
          limit.percent,
          reset
        )
      : copy.near(organizationName, limit.percent, reset);
  return (
    <div
      data-testid="assistant-near-limit"
      className="flex items-center gap-2.5 px-2 text-[12.5px]"
      style={{ color: "var(--text-muted)" }}
    >
      <span
        className="relative h-1 w-14 shrink-0 overflow-hidden rounded-full"
        style={{ background: "var(--border-soft)" }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={limit.percent}
        aria-label={text}
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${limit.percent}%`, background: "var(--warm)" }}
        />
      </span>
      <span>{text}</span>
    </div>
  );
}

/** Replaces the composer while the organization's Weekly limit is reached. */
export function LimitReached({
  organizationName,
  limit,
  canSeeUsage,
  organizationId,
}: {
  organizationName: string;
  limit: WeeklyLimitState;
  canSeeUsage: boolean;
  organizationId: string | null;
}) {
  const { t } = useTranslation();
  const copy = t.assistant.limit;
  return (
    <div
      role="status"
      className="rounded-[var(--radius-lg)] px-4 py-3"
      style={{ background: "var(--warm-soft)" }}
    >
      <div className="text-[14px] leading-[1.5]">
        <span className="font-semibold">
          {copy.paused(weeklyResetLabel(limit.resetsAt, t.common.dateLocale))}
        </span>{" "}
        {copy.pausedBody(organizationName)}
      </div>
      {canSeeUsage ? (
        <Link
          href={aiUsageHref(organizationId)}
          className="mt-1 inline-block text-[13.5px] font-semibold underline-offset-2 hover:underline"
        >
          {copy.seeUsage}
        </Link>
      ) : null}
    </div>
  );
}

/** Replaces the composer while Anthropic refuses for its spend limit or credits. */
export function AssistantUnavailable() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className="rounded-[var(--radius-lg)] px-4 py-3 text-[14px] leading-[1.5]"
      style={{ background: "var(--surface-2)" }}
    >
      {t.assistant.unavailable}
    </div>
  );
}

/* ---------------------------------------------------------------- organization picker */

export function OrgPicker({
  organizations,
  leftOut,
  value,
  onChange,
  locked,
  label,
}: {
  organizations: AssistantOrganization[];
  leftOut: AssistantOrganization[];
  value: string;
  onChange: (organizationId: string) => void;
  locked: boolean;
  /** Shown when locked, or when the chat's organization isn't among the eligible ones. */
  label: string;
}) {
  const { t } = useTranslation();
  const copy = t.assistant.picker;
  const [open, setOpen] = useState(false);
  if (locked) {
    return (
      <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
    );
  }
  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="-mx-1.5 inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-1.5 py-0.5 text-[13px] font-semibold hover:bg-[var(--surface-2)]"
      >
        {label}
        <ChevronDown className="size-3.5" aria-hidden />
      </button>
      {open ? (
        <div
          className="absolute top-full left-0 z-50 mt-1 w-72 rounded-[var(--radius-md)] border p-1.5"
          style={{
            borderColor: "var(--border)",
            background: "var(--popover)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div className="px-2.5 pt-1 pb-1.5 text-[12.5px]" style={{ color: "var(--text-muted)" }}>
            {copy.question}
          </div>
          <div role="listbox" aria-label={copy.question}>
            {organizations.map((organization) => (
              <button
                key={organization.organizationId}
                role="option"
                aria-selected={organization.organizationId === value}
                type="button"
                onClick={() => {
                  onChange(organization.organizationId);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-[14px] font-medium hover:bg-[var(--surface-2)]"
              >
                {organization.organizationName}
                {organization.organizationId === value ? (
                  <Check className="size-4" style={{ color: "var(--primary)" }} aria-hidden />
                ) : null}
              </button>
            ))}
          </div>
          {leftOut.map((organization) => (
            <div
              key={organization.organizationId}
              className="px-2.5 pt-1.5 pb-1 text-[12px]"
              style={{ color: "var(--text-faint)" }}
            >
              {!organization.planAllows
                ? copy.needsEnterprise(organization.organizationName)
                : copy.turnedOff(organization.organizationName)}
            </div>
          ))}
        </div>
      ) : null}
    </span>
  );
}

/* ---------------------------------------------------------------- new chat, loading */

export function EmptyChat({
  picker,
  onPick,
}: {
  picker: ReactNode;
  onPick: (text: string) => void;
}) {
  const { t } = useTranslation();
  const copy = t.assistant.empty;
  return (
    <div>
      <h2 className="font-heading text-[22px] leading-tight font-bold tracking-[-0.01em]">
        {copy.title}
      </h2>
      <div className="mt-2 text-[14.5px] leading-[1.55]" style={{ color: "var(--text-muted)" }}>
        {copy.introBefore} {picker}
        {copy.introAfter}
      </div>
      <div className="mt-5 border-t" style={{ borderColor: "var(--border)" }}>
        {copy.suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onPick(suggestion)}
            className="flex w-full items-center justify-between border-b py-3 text-left text-[15px] transition-colors hover:text-[color:var(--primary-strong)]"
            style={{ borderColor: "var(--border)" }}
          >
            {suggestion}
            <ArrowUp
              className="size-4 rotate-45"
              style={{ color: "var(--text-faint)" }}
              aria-hidden
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function LoadingChat() {
  const { t } = useTranslation();
  const bar = (width: string, height = 14) => (
    <div className="rounded-full" style={{ width, height, background: "var(--surface-2)" }} />
  );
  return (
    <div className="space-y-6" aria-busy="true" aria-label={t.assistant.loading}>
      <div className="flex justify-end">{bar("55%", 40)}</div>
      <div className="space-y-2">
        {bar("92%")}
        {bar("86%")}
        {bar("40%")}
      </div>
      <div className="flex justify-end">{bar("30%", 40)}</div>
    </div>
  );
}

/* ---------------------------------------------------------------- the owner's gates */

export function UpgradeGate({ organization }: { organization: AssistantOrganization }) {
  const { t } = useTranslation();
  const copy = t.assistant.upgrade;
  return (
    <div>
      <h2 className="font-heading text-[22px] leading-tight font-bold">{copy.title}</h2>
      <p className="mt-2 text-[14.5px] leading-[1.55]">
        {copy.body(organization.organizationName)}
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-4 text-[14px] leading-[1.55]">
        {copy.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <div className="mt-4">
        <Button asChild size="sm">
          <Link href="/billing/">{copy.cta}</Link>
        </Button>
      </div>
      <p className="mt-3 text-[12.5px]" style={{ color: "var(--text-faint)" }}>
        {copy.onlyYou}
      </p>
    </div>
  );
}

export function OffGate({ organization }: { organization: AssistantOrganization }) {
  const { t } = useTranslation();
  const copy = t.assistant.off;
  return (
    <div>
      <h2 className="font-heading text-[22px] leading-tight font-bold">
        {copy.title(organization.organizationName)}
      </h2>
      <p className="mt-2 text-[14.5px] leading-[1.55]">{copy.body}</p>
      <div className="mt-4">
        <Button asChild size="sm">
          <Link href="/organization/">{copy.cta}</Link>
        </Button>
      </div>
      <p className="mt-3 text-[12.5px]" style={{ color: "var(--text-faint)" }}>
        {copy.onlyAdmins}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- past chats */

const GROUPS = ["today", "thisWeek", "earlier"] as const;

export function ChatList({
  chats,
  activeId,
  onOpen,
  onDelete,
  deleteFailed,
}: {
  chats: AssistantChat[];
  activeId: string | null;
  onOpen: (chat: AssistantChat) => void;
  onDelete: (chat: AssistantChat) => void;
  deleteFailed: boolean;
}) {
  const { t } = useTranslation();
  const copy = t.assistant.history;
  const [confirming, setConfirming] = useState<string | null>(null);
  const now = new Date();
  const titleOf = (chat: AssistantChat) => chat.title ?? t.assistant.untitled;

  if (chats.length === 0) {
    return (
      <p className="px-2 py-3 text-[13.5px]" style={{ color: "var(--text-muted)" }}>
        {copy.empty}
      </p>
    );
  }

  return (
    <div>
      {deleteFailed ? (
        <p role="alert" className="px-2 pb-2 text-[13px]" style={{ color: "var(--danger)" }}>
          {copy.failed}
        </p>
      ) : null}
      {GROUPS.map((group) => {
        const rows = chats.filter((chat) => chatGroup(chat.lastMessageAt, now) === group);
        if (rows.length === 0) return null;
        return (
          <section key={group} aria-label={copy[group]} className="mb-2">
            <h3
              className="px-2 pt-2 pb-1 text-[12px] font-medium"
              style={{ color: "var(--text-faint)" }}
            >
              {copy[group]}
            </h3>
            {rows.map((chat) =>
              confirming === chat.id ? (
                <div
                  key={chat.id}
                  className="rounded-[var(--radius-sm)] px-2 py-2"
                  style={{ background: "var(--danger-soft)" }}
                >
                  <div className="text-[13.5px] leading-[1.4]">{copy.confirm(titleOf(chat))}</div>
                  <div className="mt-1.5 flex gap-1.5">
                    <Button
                      size="xs"
                      variant="destructive"
                      onClick={() => {
                        setConfirming(null);
                        onDelete(chat);
                      }}
                    >
                      {copy.confirmDelete}
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => setConfirming(null)}>
                      {copy.keep}
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  key={chat.id}
                  className={cn(
                    "group flex items-center gap-1 rounded-[var(--radius-sm)] transition-colors hover:bg-[var(--surface-2)]",
                    chat.id === activeId && "bg-[var(--surface-2)]"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onOpen(chat)}
                    aria-current={chat.id === activeId ? "true" : undefined}
                    className="min-w-0 flex-1 px-2 py-2 text-left"
                  >
                    <span className="block truncate text-[14px] font-medium">{titleOf(chat)}</span>
                    <span
                      className="block truncate text-[12px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {chat.organizationName}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={copy.remove(titleOf(chat))}
                    onClick={() => setConfirming(chat.id)}
                    className="mr-1 grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--surface)] focus-visible:opacity-100 max-md:opacity-100"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              )
            )}
          </section>
        );
      })}
    </div>
  );
}
