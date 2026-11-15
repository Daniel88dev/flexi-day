"use client";

import type { ReactNode } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatClosedReason } from "@/lib/api/assistant";
import { useTranslation } from "@/lib/i18n/use-translation";

/** Replaces the composer in a chat that takes no more messages; it stays readable. */
export function ClosedChat({
  reason,
  onNewChat,
}: {
  reason: ChatClosedReason;
  onNewChat: () => void;
}) {
  const { t } = useTranslation();
  const copy = t.assistant.closed;
  return (
    <div
      role="status"
      data-testid="assistant-chat-closed"
      className="rounded-[var(--radius-lg)] px-4 py-3"
      style={{ background: "var(--surface-2)" }}
    >
      <div className="text-[14px] leading-[1.5]">
        <span className="font-semibold">{copy.title}</span> {copy[reason]}
      </div>
      <Button size="sm" className="mt-2" onClick={onNewChat}>
        {t.assistant.newChat}
      </Button>
    </div>
  );
}

/** Replaces the composer where the organization takes no new messages: plan lapse or the Assistant off. */
export function ReadOnlyChat({ text }: { text: string }) {
  return (
    <div
      role="status"
      data-testid="assistant-read-only"
      className="rounded-[var(--radius-lg)] px-4 py-3 text-[14px] leading-[1.5]"
      style={{ background: "var(--surface-2)" }}
    >
      {text}
    </div>
  );
}

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
