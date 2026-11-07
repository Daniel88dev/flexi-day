"use client";

// PROTOTYPE (T-679): the chat pieces every variant arranges. Lives on prototype/* branches only.

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUp,
  BookOpen,
  Check,
  ChevronDown,
  Loader2,
  Lock,
  RotateCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CHATS,
  LIVE_REPLY,
  ORGS,
  RESET_LABEL,
  SUGGESTIONS,
  type CardState,
  type ChatSummary,
  type ConfirmCard,
  type LiveTurn,
  type Message,
  type OrgId,
  type Scenario,
} from "./data";

/* ---------------------------------------------------------------- chat state */

type Live =
  | { phase: "idle" }
  | { phase: "screen" | "reconnect"; turn: LiveTurn; shown: number }
  | { phase: "step"; turn: LiveTurn; step: number; shown: number }
  | { phase: "text"; turn: LiveTurn; shown: number; reconnected: boolean };

let seq = 0;
const nextId = () => `m${++seq}`;

function turnFor(text: string): LiveTurn {
  const t = text.toLowerCase();
  if (t.includes("clock")) {
    return {
      steps: ["Checked your attendance today"],
      text: "You're not clocked in yet today. Confirm and I'll start your day at 08:52.",
      card: { kind: "clock", direction: "in", time: "08:52", today: "0 h 00 m" },
    };
  }
  if (t.includes("off") || t.includes("request")) {
    return {
      steps: ["Checked your balance", "Checked who approves your requests"],
      text: "Friday 27 Nov is a working day and you have 7.5 days left. Here's the request for Tomáš Novák:",
      card: {
        kind: "create",
        type: "Vacation",
        color: "var(--c-vacation)",
        dates: "Fri 27 Nov",
        days: 1,
        balanceBefore: 7.5,
        approver: "Tomáš Novák",
        note: null,
      },
    };
  }
  return LIVE_REPLY;
}

export function useChat(scenario: Scenario) {
  const [messages, setMessages] = useState<Message[]>(scenario.messages);
  const [usage, setUsage] = useState(scenario.usage);
  const [live, setLive] = useState<Live>(
    scenario.live ? { phase: "screen", turn: scenario.live, shown: 0 } : { phase: "idle" }
  );

  useEffect(() => {
    if (live.phase === "idle") return;
    const { turn } = live;
    const finish = () => {
      const done: Message[] = [];
      if (turn.limitAt) {
        done.push({ id: nextId(), role: "assistant", text: turn.text, steps: turn.steps });
        done.push({
          id: nextId(),
          role: "fixed",
          tone: "limit",
          text: "Stopped here: Novák Logistics reached this week's Assistant limit.",
        });
        setUsage(1);
      } else {
        done.push({
          id: nextId(),
          role: "assistant",
          text: turn.text,
          citations: turn.citations,
          steps: turn.steps,
        });
        if (turn.card) done.push({ id: nextId(), role: "card", card: turn.card, state: "waiting" });
      }
      setMessages((m) => [...m, ...done]);
      setLive({ phase: "idle" });
    };

    if (live.phase === "screen") {
      const id = setTimeout(() => {
        setLive(
          turn.steps.length
            ? { phase: "step", turn, step: 0, shown: 0 }
            : { phase: "text", turn, shown: 0, reconnected: false }
        );
      }, 1100);
      return () => clearTimeout(id);
    }
    if (live.phase === "step") {
      const id = setTimeout(() => {
        if (live.step + 1 < turn.steps.length) {
          setLive({ ...live, step: live.step + 1 });
        } else {
          if (turn.limitAt && turn.card) {
            setMessages((m) => [
              ...m,
              { id: nextId(), role: "card", card: turn.card!, state: "waiting" },
            ]);
          }
          setLive({ phase: "text", turn, shown: 0, reconnected: false });
        }
      }, 1200);
      return () => clearTimeout(id);
    }
    if (live.phase === "text") {
      if (turn.reconnectAt && !live.reconnected && live.shown >= turn.reconnectAt) {
        setLive({ phase: "reconnect", turn, shown: live.shown });
        return;
      }
      if (live.shown >= turn.text.length) {
        finish();
        return;
      }
      const id = setTimeout(() => setLive({ ...live, shown: live.shown + 3 }), 22);
      return () => clearTimeout(id);
    }
    if (live.phase === "reconnect") {
      const id = setTimeout(finish, 2600);
      return () => clearTimeout(id);
    }
  }, [live]);

  const busy = live.phase !== "idle";

  function send(text: string) {
    if (busy || usage >= 1) return;
    setMessages((m) => [...m, { id: nextId(), role: "user", text }]);
    setLive({ phase: "screen", turn: turnFor(text), shown: 0 });
  }

  function retryLast() {
    if (busy) return;
    setMessages((m) => m.map((x) => (x.role === "user" && x.failed ? { ...x, failed: false } : x)));
    setLive({ phase: "screen", turn: LIVE_REPLY, shown: 0 });
  }

  function setCard(id: string, state: CardState, result?: string) {
    setMessages((m) =>
      m.map((x) => (x.id === id && x.role === "card" ? { ...x, state, result } : x))
    );
  }

  return { messages, live, busy, usage, send, retryLast, setCard };
}

export type Chat = ReturnType<typeof useChat>;

/* ---------------------------------------------------------------- text */

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}

function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-[15px] leading-[1.6]">
      {text.split("\n\n").map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="space-y-1 pl-4" style={{ listStyle: "disc" }}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.slice(2))}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{inline(block)}</p>;
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- messages */

function UserBubble({
  text,
  failed,
  onRetry,
}: {
  text: string;
  failed?: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-end gap-1">
      <div
        className="max-w-[85%] rounded-[18px] rounded-br-[6px] px-3.5 py-2.5 text-[15px] leading-[1.5]"
        style={{ background: "var(--surface-2)" }}
      >
        {text}
      </div>
      {failed ? (
        <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--danger)" }}>
          Not sent. Check your connection.
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline"
          >
            <RotateCw className="size-3.5" /> Send again
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Steps({ steps }: { steps: string[] }) {
  return (
    <div className="mb-1.5 text-[12.5px]" style={{ color: "var(--text-faint)" }}>
      {steps.join(" · ")}
    </div>
  );
}

function Sources({ citations }: { citations: { id: string; title: string }[] }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
      <span style={{ color: "var(--text-muted)" }}>From the help:</span>
      {citations.map((c) => (
        <a
          key={c.id}
          href={`/help/${c.id}/`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline"
          style={{ color: "var(--primary-strong)" }}
        >
          <BookOpen className="size-3.5" />
          {c.title}
        </a>
      ))}
    </div>
  );
}

function StatusLine({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[13.5px]" style={{ color: "var(--text-muted)" }}>
      <Loader2 className="size-3.5 animate-spin" />
      {children}
    </div>
  );
}

function LiveTurnView({ live }: { live: Exclude<Live, { phase: "idle" }> }) {
  const { turn } = live;
  if (live.phase === "screen") return <StatusLine>Reading your question</StatusLine>;
  if (live.phase === "step") {
    return (
      <div>
        {live.step > 0 ? <Steps steps={turn.steps.slice(0, live.step)} /> : null}
        <StatusLine>{turn.steps[live.step]}</StatusLine>
      </div>
    );
  }
  if (live.phase === "reconnect") {
    return (
      <div>
        <Steps steps={turn.steps} />
        <StatusLine>Still writing. The full answer appears in a moment.</StatusLine>
      </div>
    );
  }
  return (
    <div>
      {turn.steps.length ? <Steps steps={turn.steps} /> : null}
      <RichText text={turn.text.slice(0, live.shown)} />
      <span
        aria-hidden
        className="ml-0.5 inline-block h-4 w-[3px] translate-y-0.5 animate-pulse rounded-full"
        style={{ background: "var(--primary)" }}
      />
    </div>
  );
}

function FixedLine({
  tone,
  text,
  onRetry,
  canSeeUsage: _canSeeUsage,
}: {
  tone: "refusal" | "retry" | "limit" | "closed";
  text: string;
  onRetry: () => void;
  canSeeUsage: boolean;
}) {
  if (tone === "limit") {
    return (
      <div className="flex items-center gap-2 text-[14px]" style={{ color: "var(--warm)" }}>
        <span className="h-px w-5" style={{ background: "currentColor" }} aria-hidden />
        {text}
      </div>
    );
  }
  return (
    <div className="text-[15px] leading-[1.6]" style={{ color: "var(--text-muted)" }}>
      {text}
      {tone === "retry" ? (
        <button
          type="button"
          onClick={onRetry}
          className="ml-2 inline-flex items-center gap-1 text-[14px] font-semibold underline-offset-2 hover:underline"
          style={{ color: "var(--primary-strong)" }}
        >
          <RotateCw className="size-3.5" /> Try again
        </button>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- confirmation cards */

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-[14px]">
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-right tabular-nums">{children}</span>
    </div>
  );
}

function TypeDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function Quoted({ who, text }: { who: string; text: string }) {
  return (
    <div
      className="mt-2 rounded-[var(--radius-sm)] px-3 py-2.5"
      style={{ background: "var(--surface-2)" }}
    >
      <div className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>
        {who}
      </div>
      <div className="mt-0.5 text-[14px] leading-[1.5]">“{text}”</div>
    </div>
  );
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function cardTitle(card: ConfirmCard): string {
  switch (card.kind) {
    case "create":
      return `Send a ${card.type.toLowerCase()} request to ${card.approver}?`;
    case "cancel":
      return `Cancel your ${card.type.toLowerCase()} on ${card.dates}?`;
    case "decide":
      return `${card.requester} asks for ${card.days} days of ${card.type.toLowerCase()}`;
    case "clock":
      return `Clock ${card.direction} at ${card.time}?`;
  }
}

function doneText(card: ConfirmCard, state: CardState): string {
  if (state === "dismissed") return "Not sent. Nothing changed.";
  switch (card.kind) {
    case "create":
      return `Sent to ${card.approver}. Waiting for approval.`;
    case "cancel":
      return "Cancelled. Tomáš Novák was notified.";
    case "decide":
      return state === "rejected"
        ? `Rejected. ${card.requester.split(" ")[0]} was notified.`
        : `Approved. ${card.requester.split(" ")[0]} was notified.`;
    case "clock":
      return `Clocked ${card.direction} at ${card.time}.`;
  }
}

export function CardView({
  card,
  state,
  result,
  onChange,
}: {
  card: ConfirmCard;
  state: CardState;
  result?: string;
  onChange: (state: CardState, result?: string) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  function run(next: CardState) {
    onChange("working");
    setTimeout(() => {
      if (card.kind === "create" && card.dates.startsWith("Fri 27") && next === "done") {
        onChange(
          "failed",
          "You already have a home office on Fri 27 Nov. Cancel it first, or pick another day."
        );
        return;
      }
      onChange(next);
    }, 900);
  }

  const settled = state === "done" || state === "rejected" || state === "dismissed";
  if (settled) {
    return (
      <div
        className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border px-3.5 py-2.5 text-[14px]"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="flex items-center gap-2">
          {state === "dismissed" ? null : (
            <Check className="size-4 shrink-0" style={{ color: "var(--ok)" }} />
          )}
          <span>
            <span className="font-medium">{cardTitle(card).replace(/\?$/, "")}</span>
            <span style={{ color: "var(--text-muted)" }}> · {result ?? doneText(card, state)}</span>
          </span>
        </span>
        {state !== "dismissed" && card.kind !== "clock" ? (
          <Link
            href="/requests"
            className="shrink-0 text-[13px] font-semibold underline-offset-2 hover:underline"
            style={{ color: "var(--primary-strong)" }}
          >
            Open
          </Link>
        ) : null}
      </div>
    );
  }

  const working = state === "working";

  return (
    <div
      className="rounded-[var(--radius-lg)] border px-4 pt-3.5 pb-4"
      style={{ borderColor: "var(--border-strong)", background: "var(--surface)" }}
    >
      <div className="text-[15px] font-semibold">{cardTitle(card)}</div>

      <div className="mt-2">
        {card.kind === "create" ? (
          <>
            <Row label="Type">
              <TypeDot color={card.color} label={card.type} />
            </Row>
            <Row label="Dates">{card.dates}</Row>
            <Row label="Working days">{fmt(card.days)}</Row>
            <Row label="Balance after approval">
              <span style={{ color: "var(--text-muted)" }}>{fmt(card.balanceBefore)} → </span>
              {fmt(card.balanceBefore - card.days)} days
            </Row>
            {card.note ? <Quoted who="Note to Tomáš, from your message" text={card.note} /> : null}
          </>
        ) : null}

        {card.kind === "cancel" ? (
          <>
            <Row label="Type">
              <TypeDot color={card.color} label={card.type} />
            </Row>
            <Row label="Status now">{card.status}</Row>
            <Row label="Working days">{fmt(card.days)}</Row>
          </>
        ) : null}

        {card.kind === "decide" ? (
          <>
            <Row label="Dates">{card.dates}</Row>
            <Row label="Working days">{fmt(card.days)}</Row>
            <Row label={`${card.requester.split(" ")[0]}'s balance after`}>
              <span style={{ color: "var(--text-muted)" }}>{fmt(card.balanceBefore)} → </span>
              {fmt(card.balanceBefore - card.days)} days
            </Row>
            {card.overlap ? <Row label="Also away">{card.overlap}</Row> : null}
            <Quoted
              who={`${card.requester.split(" ")[0]}'s note, exactly as she wrote it`}
              text={card.requesterNote}
            />
          </>
        ) : null}

        {card.kind === "clock" ? (
          <>
            <Row label="Worked today">{card.today}</Row>
            <Row label="Starts">Now, {card.time}</Row>
          </>
        ) : null}
      </div>

      {state === "failed" ? (
        <div className="mt-3 text-[13.5px] leading-[1.5]" style={{ color: "var(--danger)" }}>
          {result}
        </div>
      ) : null}

      {rejecting ? (
        <div className="mt-3">
          <label
            className="text-[13px]"
            style={{ color: "var(--text-muted)" }}
            htmlFor="reject-reason"
          >
            Reason for Lucie, optional
          </label>
          <textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="mt-1 w-full resize-none rounded-[var(--radius-sm)] border bg-transparent px-3 py-2 text-[14px] outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--ring)]"
            style={{ borderColor: "var(--border-strong)" }}
          />
        </div>
      ) : null}

      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        {card.kind === "decide" ? (
          rejecting ? (
            <>
              <Button
                size="sm"
                variant="destructive"
                disabled={working}
                onClick={() => run("rejected")}
              >
                {working ? <Loader2 className="animate-spin" /> : null}
                Reject request
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={working}
                onClick={() => setRejecting(false)}
              >
                Back
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" disabled={working} onClick={() => run("done")}>
                {working ? <Loader2 className="animate-spin" /> : null}
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={working}
                onClick={() => setRejecting(true)}
              >
                Reject
              </Button>
            </>
          )
        ) : (
          <>
            <Button
              size="sm"
              variant={card.kind === "cancel" ? "destructive" : "default"}
              disabled={working}
              onClick={() => run("done")}
            >
              {working ? <Loader2 className="animate-spin" /> : null}
              {card.kind === "create"
                ? state === "failed"
                  ? "Try again"
                  : "Send request"
                : card.kind === "cancel"
                  ? "Cancel the day"
                  : `Clock ${card.direction}`}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={working}
              onClick={() => onChange("dismissed")}
            >
              {card.kind === "cancel" ? "Keep it" : "Not now"}
            </Button>
          </>
        )}
        <span className="ml-auto text-[12.5px]" style={{ color: "var(--text-faint)" }}>
          Marked as made through the Assistant
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- the stream */

export function MessageList({
  chat,
  canSeeUsage = false,
  className,
}: {
  chat: Chat;
  canSeeUsage?: boolean;
  className?: string;
}) {
  const end = useRef<HTMLDivElement>(null);
  const liveShown = chat.live.phase === "idle" ? -1 : "shown" in chat.live ? chat.live.shown : 0;
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [chat.messages.length, chat.live.phase, liveShown]);

  return (
    <div className={cn("space-y-5", className)}>
      {chat.messages.map((m) => {
        if (m.role === "user") {
          return <UserBubble key={m.id} text={m.text} failed={m.failed} onRetry={chat.retryLast} />;
        }
        if (m.role === "assistant") {
          return (
            <div key={m.id}>
              {m.steps?.length ? <Steps steps={m.steps} /> : null}
              <RichText text={m.text} />
              {m.citations?.length ? <Sources citations={m.citations} /> : null}
            </div>
          );
        }
        if (m.role === "card") {
          return (
            <CardView
              key={m.id}
              card={m.card}
              state={m.state}
              result={m.result}
              onChange={(s, r) => chat.setCard(m.id, s, r)}
            />
          );
        }
        return (
          <FixedLine
            key={m.id}
            tone={m.tone}
            text={m.text}
            onRetry={chat.retryLast}
            canSeeUsage={canSeeUsage}
          />
        );
      })}
      {chat.live.phase !== "idle" ? <LiveTurnView live={chat.live} /> : null}
      <div ref={end} />
    </div>
  );
}

/* ---------------------------------------------------------------- composer and what replaces it */

export function UsageNote({ usage }: { usage: number }) {
  return (
    <div className="flex items-center gap-2.5 text-[12.5px]" style={{ color: "var(--text-muted)" }}>
      <span
        className="relative h-1 w-14 shrink-0 overflow-hidden rounded-full"
        style={{ background: "var(--border-soft)" }}
        aria-hidden
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${Math.round(usage * 100)}%`, background: "var(--warm)" }}
        />
      </span>
      <span>
        Novák Logistics has used {Math.round(usage * 100)}% of this week's Assistant limit. It
        resets {RESET_LABEL}.
      </span>
    </div>
  );
}

export function Composer({
  chat,
  closed,
  onNewChat,
  canSeeUsage = false,
  autoFocus = false,
  placeholder = "Message the Assistant",
  compact = false,
}: {
  chat: Chat;
  closed?: "length" | "age";
  onNewChat: () => void;
  canSeeUsage?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  compact?: boolean;
}) {
  const [text, setText] = useState("");

  if (closed) {
    return (
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] px-4 py-3"
        style={{ background: "var(--surface-2)" }}
      >
        <div className="flex items-start gap-2.5 text-[14px] leading-[1.5]">
          <Lock className="mt-0.5 size-4 shrink-0" style={{ color: "var(--text-muted)" }} />
          <span>
            <span className="font-semibold">This chat is closed.</span>{" "}
            <span style={{ color: "var(--text-muted)" }}>
              {closed === "length"
                ? "It got too long to continue. You can still read it."
                : "Chats close 30 days after their last message. You can still read it."}
            </span>
          </span>
        </div>
        <Button size="sm" onClick={onNewChat}>
          New chat
        </Button>
      </div>
    );
  }

  if (chat.usage >= 1) {
    return (
      <div
        className="rounded-[var(--radius-lg)] px-4 py-3"
        style={{ background: "var(--warm-soft)" }}
      >
        <div className="text-[14px] leading-[1.5]">
          <span className="font-semibold">The Assistant is paused until {RESET_LABEL}.</span> Novák
          Logistics reached this week's limit. Your chats stay here to read, and requests already
          shown can still be sent.
        </div>
        {canSeeUsage ? (
          <Link
            href="/organization"
            className="mt-1 inline-block text-[13.5px] font-semibold underline-offset-2 hover:underline"
          >
            See usage
          </Link>
        ) : null}
      </div>
    );
  }

  function submit() {
    const value = text.trim();
    if (!value || chat.busy) return;
    chat.send(value);
    setText("");
  }

  return (
    <div className="space-y-2">
      <div
        className="flex items-end gap-2 rounded-[22px] border px-2 py-2 transition-colors focus-within:border-[color:var(--primary)]"
        style={{ borderColor: "var(--border-strong)", background: "var(--surface)" }}
      >
        <textarea
          aria-label="Message the Assistant"
          autoFocus={autoFocus}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          className="[field-sizing:content] max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] leading-[1.5] outline-none placeholder:text-[color:var(--text-faint)]"
        />
        <button
          type="button"
          aria-label="Send"
          onClick={submit}
          disabled={!text.trim() || chat.busy}
          className="grid size-9 shrink-0 place-items-center rounded-full transition-opacity disabled:opacity-35"
          style={{ background: "var(--primary)", color: "var(--primary-fg)" }}
        >
          {chat.busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
        </button>
      </div>
      {chat.usage >= 0.8 ? (
        <UsageNote usage={chat.usage} />
      ) : compact ? null : (
        <div className="px-2 text-[12.5px]" style={{ color: "var(--text-faint)" }}>
          Answers can be wrong. Nothing changes until you confirm it.
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- empty chat, org picker */

export function OrgPicker({
  org,
  onChange,
  locked,
  defaultOpen = false,
}: {
  org: OrgId;
  onChange: (org: OrgId) => void;
  locked: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (locked) {
    return (
      <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
        {ORGS[org].name}
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
        {ORGS[org].name}
        <ChevronDown className="size-3.5" />
      </button>
      {open ? (
        <div
          role="listbox"
          className="absolute top-full left-0 z-50 mt-1 w-72 rounded-[var(--radius-md)] border p-1.5"
          style={{
            borderColor: "var(--border)",
            background: "var(--popover)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div className="px-2.5 pt-1 pb-1.5 text-[12.5px]" style={{ color: "var(--text-muted)" }}>
            Ask in which organization? A chat stays in the one it starts in.
          </div>
          {(Object.keys(ORGS) as OrgId[]).map((id) => (
            <button
              key={id}
              role="option"
              aria-selected={id === org}
              type="button"
              onClick={() => {
                onChange(id);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-[14px] hover:bg-[var(--surface-2)]"
            >
              <span>
                <span className="block font-medium">{ORGS[id].name}</span>
                <span className="block text-[12.5px]" style={{ color: "var(--text-muted)" }}>
                  {id === "novak" ? "Warehouse Team, Office Prague" : "Design"}
                </span>
              </span>
              {id === org ? <Check className="size-4" style={{ color: "var(--primary)" }} /> : null}
            </button>
          ))}
          <div className="px-2.5 pt-1.5 pb-1 text-[12px]" style={{ color: "var(--text-faint)" }}>
            Kavárna U Mostu isn't listed: the Assistant needs Enterprise.
          </div>
        </div>
      ) : null}
    </span>
  );
}

export function EmptyChat({
  onPick,
  org,
  onOrg,
  orgPickerOpen,
  heading = "h2",
}: {
  onPick: (text: string) => void;
  org: OrgId;
  onOrg: (org: OrgId) => void;
  orgPickerOpen?: boolean;
  heading?: "h1" | "h2";
}) {
  const H = heading;
  return (
    <div>
      <H className="font-heading text-[22px] leading-tight font-bold tracking-[-0.01em]">
        Ask about time off, attendance or your team
      </H>
      <div className="mt-2 text-[14.5px] leading-[1.55]" style={{ color: "var(--text-muted)" }}>
        Answers come from Flexi Day's help and what you can already see in{" "}
        <OrgPicker org={org} onChange={onOrg} locked={false} defaultOpen={orgPickerOpen} />.
        Anything it changes waits for your OK.
      </div>
      <div className="mt-5 border-t" style={{ borderColor: "var(--border)" }}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="flex w-full items-center justify-between border-b py-3 text-left text-[15px] transition-colors hover:text-[color:var(--primary-strong)]"
            style={{ borderColor: "var(--border)" }}
          >
            {s}
            <ArrowUp className="size-4 rotate-45" style={{ color: "var(--text-faint)" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function LoadingChat() {
  const bar = (w: string, h = 14) => (
    <div className="rounded-full" style={{ width: w, height: h, background: "var(--surface-2)" }} />
  );
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Opening chat">
      <div className="flex justify-end">{bar("55%", 40)}</div>
      <div className="space-y-2">
        {bar("92%")}
        {bar("86%")}
        {bar("40%")}
      </div>
      <div className="flex justify-end">{bar("30%", 40)}</div>
      <div className="space-y-2">
        {bar("78%")}
        {bar("52%")}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- the owner's gates */

export function Gate({ kind }: { kind: "upgrade" | "off" }) {
  if (kind === "upgrade") {
    return (
      <div>
        <h2 className="font-heading text-[22px] leading-tight font-bold">
          The Assistant comes with Enterprise
        </h2>
        <p className="mt-2 text-[14.5px] leading-[1.55]">
          On Enterprise, everyone in Novák Logistics can ask who's away, check a balance, send or
          approve a request and clock in by chat, in English or Czech. Each change waits for their
          confirmation.
        </p>
        <ul
          className="mt-3 space-y-1 pl-4 text-[14px] leading-[1.55]"
          style={{ listStyle: "disc" }}
        >
          <li>Included each week, with no per-message charge</li>
          <li>It sees only what each person can already see</li>
          <li>You turn it on, and you can turn it off at any time</li>
        </ul>
        <div className="mt-4 flex gap-2">
          <Button asChild size="sm">
            <Link href="/billing">See Enterprise</Link>
          </Button>
        </div>
        <p className="mt-3 text-[12.5px]" style={{ color: "var(--text-faint)" }}>
          Only you see this. Members don't see the Assistant until it's on.
        </p>
      </div>
    );
  }
  return (
    <div>
      <h2 className="font-heading text-[22px] leading-tight font-bold">
        The Assistant is off for Novák Logistics
      </h2>
      <p className="mt-2 text-[14.5px] leading-[1.55]">
        Your plan includes it. Turn it on to let everyone ask about time off and attendance by chat.
        Answers run on Anthropic's Claude, and chats are kept for 180 days.
      </p>
      <div className="mt-4 flex gap-2">
        <Button asChild size="sm">
          <Link href="/organization">Open organization settings</Link>
        </Button>
      </div>
      <p className="mt-3 text-[12.5px]" style={{ color: "var(--text-faint)" }}>
        Only you and org admins see this.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- past chats */

export function ChatList({
  activeId,
  onOpen,
  onNew,
  dense = false,
}: {
  activeId: string | null;
  onOpen: (chat: ChatSummary) => void;
  onNew?: () => void;
  dense?: boolean;
}) {
  const [chats, setChats] = useState(CHATS);
  const [confirming, setConfirming] = useState<string | null>(null);
  const groups = ["Today", "This week", "Earlier"] as const;

  return (
    <div>
      {onNew ? (
        <Button size="sm" variant="outline" className="mb-3 w-full" onClick={onNew}>
          New chat
        </Button>
      ) : null}
      {chats.length === 0 ? (
        <p className="px-2 py-3 text-[13.5px]" style={{ color: "var(--text-muted)" }}>
          No chats yet. Chats are kept for 180 days.
        </p>
      ) : null}
      {groups.map((g) => {
        const rows = chats.filter((c) => c.group === g);
        if (!rows.length) return null;
        return (
          <div key={g} className="mb-2">
            <div
              className="px-2 pt-2 pb-1 text-[12px] font-medium"
              style={{ color: "var(--text-faint)" }}
            >
              {g}
            </div>
            {rows.map((c) =>
              confirming === c.id ? (
                <div
                  key={c.id}
                  className="rounded-[var(--radius-sm)] px-2 py-2"
                  style={{ background: "var(--danger-soft)" }}
                >
                  <div className="text-[13.5px] leading-[1.4]">
                    Delete “{c.title}”? It can't be brought back.
                  </div>
                  <div className="mt-1.5 flex gap-1.5">
                    <Button
                      size="xs"
                      variant="destructive"
                      onClick={() => {
                        setChats((all) => all.filter((x) => x.id !== c.id));
                        setConfirming(null);
                      }}
                    >
                      Delete
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => setConfirming(null)}>
                      Keep
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  key={c.id}
                  className={cn(
                    "group flex items-center gap-1 rounded-[var(--radius-sm)] transition-colors hover:bg-[var(--surface-2)]",
                    c.id === activeId && "bg-[var(--surface-2)]"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onOpen(c)}
                    aria-current={c.id === activeId ? "true" : undefined}
                    className={cn("min-w-0 flex-1 px-2 text-left", dense ? "py-1.5" : "py-2")}
                  >
                    <span className="block truncate text-[14px] font-medium">{c.title}</span>
                    <span
                      className="block truncate text-[12px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {ORGS[c.org].name} · {c.closed ? "Closed" : c.when}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${c.title}`}
                    onClick={() => setConfirming(c.id)}
                    className="mr-1 grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--surface)] focus-visible:opacity-100 max-md:opacity-100"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}

export function chatTitle(scenario: Scenario): string {
  if (!scenario.chatId) return "New chat";
  return CHATS.find((c) => c.id === scenario.chatId)?.title ?? "New chat";
}
