"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chatGroup, type AssistantChat } from "@/lib/api/assistant";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

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
