"use client";

// PROTOTYPE (T-679): three ways into the Assistant, switchable with ?variant=A|B|C, and every chat
// state on ?state=. Lives on prototype/* branches only.
//   A  Side panel: an Assistant button in the top bar opens a panel docked on the right of any page.
//   B  Own page: an Assistant link in the sidebar; past chats in a column beside the chat.
//   C  Ask dock: a composer docked at the foot of every page that grows into the chat.

import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  History,
  MessagesSquare,
  Minimize2,
  Plus,
  X,
} from "lucide-react";
import { PrototypeSwitcher } from "@/components/dev/prototype-switcher";
import { NavBadge } from "@/components/shell/nav-badge";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { SCENARIOS, scenarioFor, type ChatSummary, type OrgId, type Scenario } from "./data";
import {
  ChatList,
  Composer,
  EmptyChat,
  Gate,
  LoadingChat,
  MessageList,
  OrgPicker,
  chatTitle,
  useChat,
} from "./parts";

const VARIANTS = [
  { key: "A", name: "Side panel" },
  { key: "B", name: "Own page" },
  { key: "C", name: "Ask dock" },
] as const;
type VariantKey = (typeof VARIANTS)[number]["key"];

const OPEN_CHAT: Record<string, Scenario["key"]> = {
  away: "error",
  christmas: "create",
  lucie: "decide",
  clock: "cancel-clock",
  studio: "answer",
  half: "answer",
  carry: "closed-age",
};

/* ---------------------------------------------------------------- shared prototype state */

let open = true;
const listeners = new Set<() => void>();
const openStore = {
  get: () => open,
  set: (v: boolean) => {
    open = v;
    listeners.forEach((l) => l());
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};
function useOpen() {
  return useSyncExternalStore(openStore.subscribe, openStore.get, () => true);
}

function useProto() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const variant = (params.get("variant") ?? "A") as VariantKey;
  const scenario = scenarioFor(params.get("state"));

  // Keep ?variant and ?state across sidebar navigation, which drops the query.
  useEffect(() => {
    const v = params.get("variant");
    const s = params.get("state");
    if (v || s) {
      if (v) localStorage.setItem("proto-assistant-variant", v);
      if (s) localStorage.setItem("proto-assistant-state", s);
      return;
    }
    const sv = localStorage.getItem("proto-assistant-variant");
    const ss = localStorage.getItem("proto-assistant-state");
    if (sv || ss) {
      const q = new URLSearchParams(params.toString());
      if (sv) q.set("variant", sv);
      if (ss) q.set("state", ss);
      router.replace(`${pathname}?${q.toString()}`, { scroll: false });
    }
  }, [params, pathname, router]);

  function setState(key: Scenario["key"]) {
    const q = new URLSearchParams(params.toString());
    q.set("state", key);
    localStorage.setItem("proto-assistant-state", key);
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  }

  return { variant, scenario, setState, params };
}

/** Everything one open chat needs, reset whenever the state changes. */
function useSurface(scenario: Scenario) {
  const chat = useChat(scenario);
  const [org, setOrg] = useState<OrgId>(scenario.org);
  return { chat, org, setOrg };
}

function Body({
  scenario,
  surface,
  heading = "h2",
}: {
  scenario: Scenario;
  surface: ReturnType<typeof useSurface>;
  heading?: "h1" | "h2";
}) {
  if (scenario.gate) return <Gate kind={scenario.gate} />;
  if (scenario.loading) return <LoadingChat />;
  if (surface.chat.messages.length === 0 && surface.chat.live.phase === "idle") {
    return (
      <EmptyChat
        onPick={surface.chat.send}
        org={surface.org}
        onOrg={surface.setOrg}
        orgPickerOpen={scenario.orgPickerOpen}
        heading={heading}
      />
    );
  }
  return <MessageList chat={surface.chat} canSeeUsage />;
}

function Foot({
  scenario,
  surface,
  onNew,
  compact,
  autoFocus,
}: {
  scenario: Scenario;
  surface: ReturnType<typeof useSurface>;
  onNew: () => void;
  compact?: boolean;
  autoFocus?: boolean;
}) {
  if (scenario.gate || scenario.loading) return null;
  return (
    <Composer
      chat={surface.chat}
      closed={scenario.closed}
      onNewChat={onNew}
      canSeeUsage
      compact={compact}
      autoFocus={autoFocus}
    />
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
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

/* ---------------------------------------------------------------- A: side panel */

function PanelEntry() {
  const isOpen = useOpen();
  return (
    <button
      type="button"
      aria-pressed={isOpen}
      onClick={() => openStore.set(!isOpen)}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors max-md:size-9 max-md:justify-center max-md:px-0",
        isOpen ? "bg-[var(--primary-soft)]" : "hover:bg-[var(--surface-2)]"
      )}
      style={{
        borderColor: isOpen ? "transparent" : "var(--border-strong)",
        color: isOpen ? "var(--primary-strong)" : "var(--text)",
      }}
    >
      <MessagesSquare className="size-4" />
      <span className="max-md:sr-only">Assistant</span>
    </button>
  );
}

function SidePanel({
  scenario,
  onState,
}: {
  scenario: Scenario;
  onState: (k: Scenario["key"]) => void;
}) {
  const isOpen = useOpen();
  const surface = useSurface(scenario);
  const [history, setHistory] = useState(false);
  const locked = surface.chat.messages.length > 0 || !!scenario.chatId;

  if (!isOpen) return null;

  const openChat = (c: ChatSummary) => {
    setHistory(false);
    onState(OPEN_CHAT[c.id] ?? "answer");
  };

  return (
    <aside
      aria-label="Assistant"
      className="fixed top-[60px] right-0 z-20 flex h-[calc(100dvh-60px)] w-[440px] flex-col border-l max-md:top-14 max-md:z-40 max-md:h-[calc(100dvh-56px)] max-md:w-full"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <header
        className="flex h-[60px] shrink-0 items-center gap-1 border-b px-2"
        style={{ borderColor: "var(--border)" }}
      >
        {history ? (
          <>
            <IconButton label="Back to the chat" onClick={() => setHistory(false)}>
              <ChevronLeft className="size-[18px]" />
            </IconButton>
            <div className="flex-1 text-[15px] font-semibold">Your chats</div>
          </>
        ) : (
          <>
            <IconButton label="Your chats" onClick={() => setHistory(true)}>
              <History className="size-[18px]" />
            </IconButton>
            <div className="min-w-0 flex-1 px-1">
              <div className="truncate text-[15px] leading-tight font-semibold">
                {scenario.gate ? "Assistant" : chatTitle(scenario)}
              </div>
              {scenario.gate ? null : (
                <OrgPicker org={surface.org} onChange={surface.setOrg} locked={locked} />
              )}
            </div>
            <IconButton label="New chat" onClick={() => onState("empty")}>
              <Plus className="size-[18px]" />
            </IconButton>
          </>
        )}
        <IconButton label="Close the Assistant" onClick={() => openStore.set(false)}>
          <X className="size-[18px]" />
        </IconButton>
      </header>

      {history ? (
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <ChatList activeId={scenario.chatId} onOpen={openChat} />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <Body scenario={scenario} surface={surface} />
          </div>
          <div className="shrink-0 px-4 pt-2 pb-4">
            <Foot scenario={scenario} surface={surface} onNew={() => onState("empty")} />
          </div>
        </>
      )}
    </aside>
  );
}

/* ---------------------------------------------------------------- B: own page */

function PageEntry() {
  const pathname = usePathname();
  const params = useSearchParams();
  const active = pathname.startsWith("/assistant");
  return (
    <SidebarMenu className="px-1 pt-2">
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={active}
          tooltip="Assistant"
          className={cn(
            "h-9 gap-2.5 rounded-[var(--radius-sm)] px-2.5 font-semibold text-[color:var(--text-muted)]",
            "hover:bg-[var(--surface-2)] hover:text-[color:var(--text)]",
            "data-active:bg-[var(--primary-soft)] data-active:text-[color:var(--primary-strong)]",
            "group-data-[collapsible=icon]:mx-auto"
          )}
        >
          <Link
            href={`/assistant/?${params.toString()}`}
            aria-current={active ? "page" : undefined}
          >
            <MessagesSquare className="size-[18px]" />
            <span>Assistant</span>
            {params.get("state") === "upgrade" ? (
              <NavBadge className="group-data-[collapsible=icon]:hidden">Enterprise</NavBadge>
            ) : null}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function AssistantPageInner() {
  const { scenario, setState } = useProto();
  const surface = useSurface(scenario);
  const [pane, setPane] = useState<"list" | "chat">("chat");
  const locked = surface.chat.messages.length > 0 || !!scenario.chatId;

  return (
    <div className="-my-2 grid h-[calc(100dvh-60px-48px)] grid-cols-[272px_minmax(0,1fr)] gap-8 max-md:h-[calc(100dvh-56px-72px-48px)] max-md:grid-cols-1">
      <nav
        aria-label="Your chats"
        className={cn(
          "flex min-h-0 flex-col border-r pr-6 max-md:border-r-0 max-md:pr-0",
          pane === "chat" && "max-md:hidden"
        )}
        style={{ borderColor: "var(--border)" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Your chats</h2>
          <button
            type="button"
            onClick={() => {
              setState("empty");
              setPane("chat");
            }}
            className="inline-flex items-center gap-1 text-[13.5px] font-semibold"
            style={{ color: "var(--primary-strong)" }}
          >
            <Plus className="size-4" /> New chat
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ChatList
            activeId={scenario.chatId}
            onOpen={(c) => {
              setState(OPEN_CHAT[c.id] ?? "answer");
              setPane("chat");
            }}
          />
        </div>
        <p className="pt-3 text-[12px] leading-[1.45]" style={{ color: "var(--text-faint)" }}>
          Chats are kept for 180 days.
        </p>
      </nav>

      <section className={cn("flex min-h-0 flex-col", pane === "list" && "max-md:hidden")}>
        <div className="flex items-start gap-2 pb-4">
          <button
            type="button"
            onClick={() => setPane("list")}
            aria-label="Your chats"
            className="grid size-9 place-items-center rounded-[var(--radius-sm)] md:hidden"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="min-w-0">
            <h1 className="font-heading truncate text-2xl font-bold">
              {scenario.gate || !scenario.chatId ? "Assistant" : chatTitle(scenario)}
            </h1>
            {scenario.gate ? null : (
              <div className="mt-0.5">
                <OrgPicker org={surface.org} onChange={surface.setOrg} locked={locked} />
              </div>
            )}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[720px] py-2">
            <Body scenario={scenario} surface={surface} />
          </div>
        </div>
        <div className="mx-auto w-full max-w-[720px] pt-3">
          <Foot scenario={scenario} surface={surface} onNew={() => setState("empty")} />
        </div>
      </section>
    </div>
  );
}

export function AssistantPagePrototype() {
  return (
    <Suspense>
      <KeyedPage />
    </Suspense>
  );
}

function KeyedPage() {
  const { scenario } = useProto();
  return <AssistantPageInner key={scenario.key} />;
}

/* ---------------------------------------------------------------- C: ask dock */

function AskDock({
  scenario,
  onState,
}: {
  scenario: Scenario;
  onState: (k: Scenario["key"]) => void;
}) {
  const isOpen = useOpen();
  const surface = useSurface(scenario);
  const [history, setHistory] = useState(false);
  const locked = surface.chat.messages.length > 0 || !!scenario.chatId;
  const hasChat = surface.chat.messages.length > 0 || surface.chat.live.phase !== "idle";

  // Sending from the collapsed dock opens the chat.
  useEffect(() => {
    if (surface.chat.busy) openStore.set(true);
  }, [surface.chat.busy]);

  return (
    <div
      className={cn(
        "pointer-events-none sticky bottom-6 z-30 mx-auto w-[calc(100%-48px)] max-w-[760px] max-md:bottom-[88px] max-md:w-[calc(100%-24px)]",
        isOpen && "max-md:z-[60]"
      )}
    >
      <div
        className={cn(
          "pointer-events-auto flex flex-col overflow-hidden rounded-[24px] border",
          isOpen && "max-md:fixed max-md:inset-0 max-md:z-[60] max-md:rounded-none"
        )}
        style={{
          background: "var(--surface)",
          borderColor: "var(--border-strong)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {isOpen ? (
          <>
            <header
              className="flex h-14 shrink-0 items-center gap-1 border-b px-2"
              style={{ borderColor: "var(--border)" }}
            >
              {history ? (
                <>
                  <IconButton label="Back to the chat" onClick={() => setHistory(false)}>
                    <ChevronLeft className="size-[18px]" />
                  </IconButton>
                  <div className="flex-1 text-[15px] font-semibold">Your chats</div>
                </>
              ) : (
                <>
                  <IconButton label="Your chats" onClick={() => setHistory(true)}>
                    <History className="size-[18px]" />
                  </IconButton>
                  <div className="flex min-w-0 flex-1 items-baseline gap-2 px-1">
                    <span className="truncate text-[15px] font-semibold">
                      {scenario.gate ? "Assistant" : chatTitle(scenario)}
                    </span>
                    {scenario.gate ? null : (
                      <OrgPicker org={surface.org} onChange={surface.setOrg} locked={locked} />
                    )}
                  </div>
                  <IconButton label="New chat" onClick={() => onState("empty")}>
                    <Plus className="size-[18px]" />
                  </IconButton>
                </>
              )}
              <IconButton label="Minimise" onClick={() => openStore.set(false)}>
                <Minimize2 className="size-[17px]" />
              </IconButton>
            </header>
            {history ? (
              <div className="max-h-[min(560px,62dvh)] overflow-y-auto px-3 py-3 max-md:max-h-none max-md:flex-1">
                <ChatList
                  activeId={scenario.chatId}
                  onOpen={(c) => {
                    setHistory(false);
                    onState(OPEN_CHAT[c.id] ?? "answer");
                  }}
                />
              </div>
            ) : (
              <div className="max-h-[min(560px,62dvh)] overflow-y-auto px-6 py-5 max-md:max-h-none max-md:flex-1 max-md:px-4">
                <Body scenario={scenario} surface={surface} />
              </div>
            )}
            {history ? null : (
              <div className="shrink-0 px-4 pt-1 pb-4">
                <Foot scenario={scenario} surface={surface} onNew={() => onState("empty")} />
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-1 p-1.5 pl-2">
            <IconButton
              label="Your chats"
              onClick={() => {
                setHistory(true);
                openStore.set(true);
              }}
            >
              <History className="size-[18px]" />
            </IconButton>
            <div className="min-w-0 flex-1">
              {scenario.gate ? (
                <button
                  type="button"
                  onClick={() => openStore.set(true)}
                  className="w-full px-2 py-2 text-left text-[14.5px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {scenario.gate === "upgrade"
                    ? "The Assistant comes with Enterprise. See what it does"
                    : "The Assistant is off for Novák Logistics. Turn it on"}
                </button>
              ) : (
                <div className="[&>div>div:first-child]:border-0 [&>div>div:first-child]:bg-transparent">
                  <Foot
                    scenario={scenario}
                    surface={surface}
                    onNew={() => onState("empty")}
                    compact
                  />
                </div>
              )}
            </div>
            {hasChat ? (
              <IconButton label="Open the chat" onClick={() => openStore.set(true)}>
                <ChevronDown className="size-[18px] rotate-180" />
              </IconButton>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- mounting points */

function StateSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (k: Scenario["key"]) => void;
}) {
  return (
    <select
      aria-label="Chat state"
      value={value}
      onChange={(e) => onChange(e.target.value as Scenario["key"])}
      className="ml-1 max-w-[13rem] rounded-full bg-white/15 px-2.5 py-1 text-[13px] font-semibold text-white outline-none"
    >
      {SCENARIOS.map((s) => (
        <option key={s.key} value={s.key} className="text-black">
          {s.name}
        </option>
      ))}
    </select>
  );
}

function ShellInner() {
  const { variant, scenario, setState } = useProto();
  return (
    <>
      {variant === "A" ? (
        <SidePanel key={scenario.key} scenario={scenario} onState={setState} />
      ) : null}
      <PrototypeSwitcher
        variants={VARIANTS}
        extra={<StateSelect value={scenario.key} onChange={setState} />}
      />
    </>
  );
}

function DockInner() {
  const { variant, scenario, setState } = useProto();
  if (variant !== "C") return null;
  return <AskDock key={scenario.key} scenario={scenario} onState={setState} />;
}

function TopBarInner() {
  const { variant } = useProto();
  return variant === "A" ? <PanelEntry /> : null;
}

function SidebarInner() {
  const { variant } = useProto();
  return variant === "B" ? <PageEntry /> : null;
}

/** Mounted once in the shell: the side panel and the switcher. */
export function AssistantPrototypeShell() {
  return (
    <Suspense>
      <ShellInner />
    </Suspense>
  );
}

/** Mounted after the page content, so it sticks to the foot of the canvas. */
export function AssistantPrototypeDock() {
  return (
    <Suspense>
      <DockInner />
    </Suspense>
  );
}

export function AssistantPrototypeTopBar() {
  return (
    <Suspense>
      <TopBarInner />
    </Suspense>
  );
}

export function AssistantPrototypeSidebar() {
  return (
    <Suspense>
      <SidebarInner />
    </Suspense>
  );
}
