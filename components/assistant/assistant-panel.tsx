"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, History, MessagesSquare, Plus, X } from "lucide-react";
import { AiFeatureGate } from "@/components/ai/ai-feature-gate";
import { assistantEntry, type AssistantOrganization } from "@/lib/api/assistant";
import {
  useAssistantChat,
  useAssistantChats,
  useAssistantOrganizations,
  useDeleteAssistantChat,
} from "@/lib/api/assistant-queries";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";
import { setAssistantOpen, useAssistantOpen } from "./assistant-store";
import {
  ChatList,
  Composer,
  EmptyChat,
  LoadingChat,
  MessageList,
  OffGate,
  OrgPicker,
  UpgradeGate,
} from "./chat-parts";
import { useAssistantTurn } from "./use-assistant-turn";

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] transition-colors hover:bg-[var(--surface-2)]"
      style={{ color: "var(--text-muted)" }}
    >
      {children}
    </button>
  );
}

/** The top bar's entry point: shown only where the button rules leave it, opening the panel. */
export function AssistantButton() {
  return (
    <AiFeatureGate feature="assistant">
      <AssistantButtonInner />
    </AiFeatureGate>
  );
}

function AssistantButtonInner() {
  const { t } = useTranslation();
  const open = useAssistantOpen();
  const { data } = useAssistantOrganizations();
  if (assistantEntry(data).mode === "hidden") return null;
  return (
    <button
      type="button"
      aria-pressed={open}
      onClick={() => setAssistantOpen(!open)}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors max-md:size-9 max-md:justify-center max-md:px-0",
        open ? "bg-[var(--primary-soft)]" : "hover:bg-[var(--surface-2)]"
      )}
      style={{
        borderColor: open ? "transparent" : "var(--border-strong)",
        color: open ? "var(--primary-strong)" : "var(--text)",
      }}
    >
      <MessagesSquare className="size-4" aria-hidden />
      <span className="max-md:sr-only">{t.assistant.button}</span>
    </button>
  );
}

/** The docked panel, mounted once by the shell; renders while open. */
export function AssistantPanel() {
  return (
    <AiFeatureGate feature="assistant">
      <AssistantPanelHost />
    </AiFeatureGate>
  );
}

function AssistantPanelHost() {
  const open = useAssistantOpen();
  return open ? <PanelFrame /> : null;
}

function PanelFrame() {
  const { t } = useTranslation();
  const copy = t.assistant;
  const organizations = useAssistantOrganizations();
  const entry = assistantEntry(organizations.data);
  const [history, setHistory] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  // Bumped when the user opens another chat or starts a new one, never when a first message
  // creates the chat: a remount would drop the answer being streamed.
  const [view, setView] = useState(0);

  const chatMode = entry.mode === "chat" ? entry : null;
  const organizationId = picked ?? chatMode?.organizations[0]?.organizationId ?? null;

  const startNewChat = () => {
    setHistory(false);
    setChatId(null);
    setView((v) => v + 1);
  };

  return (
    <aside
      aria-label={copy.button}
      className="fixed top-[60px] right-0 z-20 flex h-[calc(100dvh-60px)] w-[440px] flex-col border-l max-md:top-14 max-md:z-40 max-md:h-[calc(100dvh-56px-72px-env(safe-area-inset-bottom))] max-md:w-full"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      {chatMode && !organizations.isPending ? (
        history ? (
          <HistoryView
            activeId={chatId}
            onBack={() => setHistory(false)}
            onOpen={(id) => {
              if (id !== chatId) setView((v) => v + 1);
              setChatId(id);
              setHistory(false);
            }}
            onDeleted={(id) => {
              if (id !== chatId) return;
              setChatId(null);
              setView((v) => v + 1);
            }}
          />
        ) : (
          <ChatView
            key={view}
            chatId={chatId}
            organizations={chatMode.organizations}
            leftOut={chatMode.leftOut}
            organizationId={organizationId}
            onOrganization={setPicked}
            onChatCreated={setChatId}
            onHistory={() => setHistory(true)}
            onNewChat={startNewChat}
          />
        )
      ) : (
        <>
          <Header title={copy.button} />
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {organizations.isPending ? (
              <LoadingChat />
            ) : entry.mode === "upgrade" ? (
              <UpgradeGate organization={entry.organization} />
            ) : entry.mode === "off" ? (
              <OffGate organization={entry.organization} />
            ) : null}
          </div>
        </>
      )}
    </aside>
  );
}

function Header({
  title,
  subtitle,
  onHistory,
  onBack,
  onNewChat,
}: {
  title: string;
  subtitle?: ReactNode;
  onHistory?: () => void;
  onBack?: () => void;
  onNewChat?: () => void;
}) {
  const { t } = useTranslation();
  const copy = t.assistant;
  return (
    <header
      className="flex h-[60px] shrink-0 items-center gap-1 border-b px-2"
      style={{ borderColor: "var(--border)" }}
    >
      {onBack ? (
        <IconButton label={copy.backToChat} onClick={onBack}>
          <ChevronLeft className="size-[18px]" aria-hidden />
        </IconButton>
      ) : onHistory ? (
        <IconButton label={copy.pastChats} onClick={onHistory}>
          <History className="size-[18px]" aria-hidden />
        </IconButton>
      ) : (
        <span className="w-2" />
      )}
      <div className="min-w-0 flex-1 px-1">
        <div className="truncate text-[15px] leading-tight font-semibold">{title}</div>
        {subtitle}
      </div>
      {onNewChat ? (
        <IconButton label={copy.newChat} onClick={onNewChat}>
          <Plus className="size-[18px]" aria-hidden />
        </IconButton>
      ) : null}
      <IconButton label={copy.close} onClick={() => setAssistantOpen(false)}>
        <X className="size-[18px]" aria-hidden />
      </IconButton>
    </header>
  );
}

function HistoryView({
  activeId,
  onBack,
  onOpen,
  onDeleted,
}: {
  activeId: string | null;
  onBack: () => void;
  onOpen: (chatId: string) => void;
  onDeleted: (chatId: string) => void;
}) {
  const { t } = useTranslation();
  const chats = useAssistantChats();
  const remove = useDeleteAssistantChat();
  return (
    <>
      <Header title={t.assistant.pastChats} onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {chats.isPending ? (
          <LoadingChat />
        ) : (
          <ChatList
            chats={chats.data ?? []}
            activeId={activeId}
            onOpen={(chat) => onOpen(chat.id)}
            onDelete={(chat) => remove.mutate(chat.id, { onSuccess: () => onDeleted(chat.id) })}
            deleteFailed={remove.isError}
          />
        )}
      </div>
    </>
  );
}

function ChatView({
  chatId,
  organizations,
  leftOut,
  organizationId,
  onOrganization,
  onChatCreated,
  onHistory,
  onNewChat,
}: {
  chatId: string | null;
  organizations: AssistantOrganization[];
  leftOut: AssistantOrganization[];
  organizationId: string | null;
  onOrganization: (organizationId: string) => void;
  onChatCreated: (chatId: string) => void;
  onHistory: () => void;
  onNewChat: () => void;
}) {
  const { t } = useTranslation();
  const copy = t.assistant;
  // The chat a first message creates stays in this view.
  const [ownChatId, setOwnChatId] = useState(chatId);
  const detail = useAssistantChat(ownChatId);
  const turn = useAssistantTurn({
    chatId: ownChatId,
    turnRunning: detail.data?.chat.turnRunning ?? false,
    onChatCreated: (id) => {
      setOwnChatId(id);
      onChatCreated(id);
    },
  });

  const chat = detail.data?.chat;
  const started = !!ownChatId || !!turn.live || !!turn.failed;
  const organizationName =
    chat?.organizationName ??
    organizations.find((o) => o.organizationId === organizationId)?.organizationName ??
    "";
  const title = chat?.title ?? turn.live?.userText ?? turn.failed?.text ?? copy.untitled;

  const picker = (
    <OrgPicker
      organizations={organizations}
      leftOut={leftOut}
      value={organizationId ?? ""}
      onChange={onOrganization}
      locked={started}
      label={organizationName}
    />
  );

  const send = (text: string) => {
    if (organizationId || ownChatId) void turn.send(text, organizationId ?? "");
  };

  return (
    <>
      <Header
        title={started ? title : copy.newChat}
        subtitle={<div>{picker}</div>}
        onHistory={onHistory}
        onNewChat={onNewChat}
      />
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {ownChatId && detail.isPending ? (
          <LoadingChat />
        ) : !started ? (
          <EmptyChat picker={picker} onPick={send} />
        ) : (
          <MessageList
            messages={detail.data?.messages ?? []}
            live={turn.live}
            failed={turn.failed}
          />
        )}
      </div>
      <div className="shrink-0 px-4 pt-2 pb-4">
        <Composer busy={turn.busy} onSend={send} />
      </div>
    </>
  );
}
