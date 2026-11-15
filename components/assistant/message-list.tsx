"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CardDecision, DisplayMessage } from "@/lib/api/assistant";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";
import { ConfirmCard } from "./confirm-card";
import { Notice, noticeText } from "./notices";
import { RichText } from "./rich-text";
import { toolLine } from "./tool-lines";
import type { FailedSend, LiveTurn } from "./use-assistant-turn";

/** A tool line whose result the Weekly limit kept from being sent; the notice after it says why. */
const TOOL_STOPPED = "stopped";

/** A user row the screen rejected: the message never reached the Assistant. */
const REJECTED = "REJECTED";

/** Codes of a failed send that a plain resend can fix. */
const RESENDABLE = new Set([null, "ASSISTANT_SCREEN_FAILED", "ASSISTANT_TURN_RUNNING"]);

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
