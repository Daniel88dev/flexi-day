"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, History, MessagesSquare, Plus, X } from "lucide-react";
import { AiFeatureGate } from "@/components/ai/ai-feature-gate";
import {
  assistantEntry,
  NEAR_LIMIT_PERCENT,
  type AssistantGate,
  type AssistantOrganization,
} from "@/lib/api/assistant";
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
  AssistantUnavailable,
  ChatList,
  ClosedChat,
  Composer,
  EmptyChat,
  LimitReached,
  LoadingChat,
  MessageList,
  NearLimit,
  OffGate,
  OrgPicker,
  ReadOnlyChat,
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
  if (assistantEntry(data?.organizations).mode === "hidden") return null;
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
  const entry = assistantEntry(organizations.data?.organizations);
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
            gate={chatMode.gate}
            organizationId={organizationId}
            onOrganization={setPicked}
            onChatCreated={setChatId}
            onHistory={() => setHistory(true)}
            onNewChat={startNewChat}
            providerUnavailable={organizations.data?.providerUnavailable ?? false}
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
  gate,
  organizationId,
  onOrganization,
  onChatCreated,
  onHistory,
  onNewChat,
  providerUnavailable,
}: {
  chatId: string | null;
  organizations: AssistantOrganization[];
  leftOut: AssistantOrganization[];
  gate: AssistantGate | null;
  organizationId: string | null;
  onOrganization: (organizationId: string) => void;
  onChatCreated: (chatId: string) => void;
  onHistory: () => void;
  onNewChat: () => void;
  providerUnavailable: boolean;
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
  const organization = organizations.find(
    (o) => o.organizationId === (chat?.organizationId ?? organizationId)
  );
  const limit = organization?.weeklyLimit ?? null;
  const chatOrganization = chat
    ? leftOut.find((o) => o.organizationId === chat.organizationId)
    : undefined;
  // A chat stays readable where the organization takes no new messages; a new one has nowhere to go.
  const readOnly =
    chatOrganization?.reason === "TURNED_OFF" || chatOrganization?.reason === "PLAN"
      ? copy.readOnly[chatOrganization.reason](organizationName)
      : !chat && organizations.length === 0
        ? copy.readOnly.none
        : null;
  const closed = chat?.closed ?? null;
  const canSeeUsage = organization?.role === "owner" || organization?.role === "admin";

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

  // The paused and unavailable notices replace the composer; the suggestions stop too.
  const blocked = !!closed || !!readOnly || providerUnavailable || (limit?.reached ?? false);
  const send = (text: string) => {
    if (blocked) return;
    if (organizationId || ownChatId) void turn.send(text, organizationId ?? "");
  };

  return (
    <>
      <Header
        title={started ? title : copy.newChat}
        subtitle={organizations.length > 0 || started ? <div>{picker}</div> : undefined}
        onHistory={onHistory}
        onNewChat={onNewChat}
      />
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {ownChatId && detail.isPending ? (
          <LoadingChat />
        ) : !started && organizations.length === 0 ? (
          gate?.mode === "upgrade" ? (
            <UpgradeGate organization={gate.organization} />
          ) : gate?.mode === "off" ? (
            <OffGate organization={gate.organization} />
          ) : null
        ) : !started ? (
          <EmptyChat picker={picker} onPick={send} />
        ) : (
          <MessageList
            messages={detail.data?.messages ?? []}
            live={turn.live}
            failed={turn.failed}
            onResend={send}
            onCardDecided={(decision) => {
              if (decision.turnRunning) turn.resume();
              else if (ownChatId) void turn.finish(ownChatId);
            }}
            organizationName={organizationName}
          />
        )}
      </div>
      <div className="shrink-0 space-y-2 px-4 pt-2 pb-4">
        {closed ? (
          <ClosedChat reason={closed} onNewChat={onNewChat} />
        ) : readOnly ? (
          <ReadOnlyChat text={readOnly} />
        ) : providerUnavailable ? (
          <AssistantUnavailable />
        ) : limit?.reached && !turn.live ? (
          <LimitReached
            organizationName={organizationName}
            limit={limit}
            canSeeUsage={canSeeUsage}
            organizationId={organization?.organizationId ?? null}
          />
        ) : (
          <>
            <Composer busy={turn.busy} onSend={send} />
            {limit && limit.percent >= NEAR_LIMIT_PERCENT ? (
              <NearLimit organizationName={organizationName} limit={limit} />
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
