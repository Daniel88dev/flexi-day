import { correlationHeaders } from "@/lib/observability/session";
import { API_BASE_URL, ApiError, api, type ApiErrorEntry } from "./client";

export type AssistantIneligibleReason = "NO_STANDING" | "TURNED_OFF" | "PLAN";

/** One organization for the Assistant's picker and button, as `GET /api/assistant/organizations` answers. */
export type AssistantOrganization = {
  organizationId: string;
  organizationName: string;
  eligible: boolean;
  reason: AssistantIneligibleReason | null;
  /** The plan includes the Assistant (Enterprise or Custom). */
  planAllows: boolean;
  role: "owner" | "admin" | "member";
  /** This week's Usage against the Weekly limit; null where the caller can't chat. */
  weeklyLimit: WeeklyLimitState | null;
};

/**
 * An organization's Weekly limit as the panel shows it. "Used" is settled plus
 * reserved; the amounts are null for members, who see the percentage only.
 */
export type WeeklyLimitState = {
  percent: number;
  /** No turn can start until `resetsAt`. */
  reached: boolean;
  resetsAt: string;
  usedMicroUsd: number | null;
  limitMicroUsd: number | null;
};

export type AssistantOrganizations = {
  organizations: AssistantOrganization[];
  /** Anthropic refused for its spend limit or credits a moment ago: the Assistant is out for everyone. */
  providerUnavailable: boolean;
};

/** The near-limit bar shows from this share of the Weekly limit. */
export const NEAR_LIMIT_PERCENT = 80;

/** The reset as the viewer's own weekday, date and time, such as "Monday 16 Nov, 01:00". */
export function weeklyResetLabel(resetsAt: string, dateLocale: string): string {
  return new Intl.DateTimeFormat(dateLocale, {
    weekday: "long",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(resetsAt));
}

export type AssistantChat = {
  id: string;
  organizationId: string;
  organizationName: string;
  title: string | null;
  createdAt: string;
  lastMessageAt: string;
  turnRunning: boolean;
};

export type DisplayMessage = {
  id: string;
  kind: "user" | "assistant" | "tool" | "notice";
  text: string | null;
  toolName: string | null;
  toolOutcome: string | null;
  code: string | null;
  /** A write's confirmation card, on its tool line. */
  card: PendingCard | null;
  createdAt: string;
};

export type CardStatus = "open" | "confirmed" | "declined" | "not_taken";

/** Where one allowance stands before and after the write. */
export type AllowanceChange = {
  year: number;
  type: string;
  allocated: number;
  approved: number;
  pending: number;
  availableBefore: number;
  availableAfter: number;
};

/** The requester's balance as the app shows it (allocated minus approved), before and after a decision. */
export type BalanceChange = {
  year: number;
  type: string;
  allocated: number;
  remainingBefore: number;
  remainingAfter: number;
};

/** The write's dry run, as the backend's `WritePreview`: the card's only content. */
export type CardPreview =
  | {
      action: "create_request";
      group: { id: string; name: string };
      type: string;
      firstDay: string;
      lastDay: string;
      halfDay: boolean;
      bookedDays: string[];
      days: number;
      note: string | null;
      allowances: AllowanceChange[];
    }
  | {
      action: "cancel_my_request";
      requestId: string;
      group: { id: string; name: string };
      type: string;
      status: "pending" | "approved" | "partly_approved";
      firstDay: string;
      lastDay: string;
      cancelledDays: string[];
      days: number;
      note: string | null;
      reason: string | null;
      allowances: AllowanceChange[];
    }
  | {
      action: "approve_request" | "reject_request";
      requestId: string;
      requester: { id: string; name: string };
      group: { id: string; name: string };
      type: string;
      firstDay: string;
      lastDay: string;
      decidedDays: string[];
      days: number;
      /** The request's own note and who wrote it. */
      note: string | null;
      noteAuthor: string | null;
      /** Reject only: the reason the Assistant proposed. */
      reason: string | null;
      balances: BalanceChange[];
    }
  | { action: "clock_in"; at: string; businessDate: string; timezone: string }
  | {
      action: "clock_out";
      at: string;
      startedAt: string;
      businessDate: string;
      timezone: string;
      onBreak: boolean;
      sessionMinutes: number;
    };

/** A confirmation card: a write the Assistant asked for, waiting on the user. */
export type PendingCard = {
  id: string;
  chatId: string;
  toolUseId: string;
  tool: CardPreview["action"];
  status: CardStatus;
  preview: CardPreview;
  /** People other than the user whose notes the Assistant read before suggesting it. */
  authorNames: string[];
  result: Record<string, unknown> | null;
  /** Why the last confirm was refused; the card stays open. */
  error: { message: string; code: string | null } | null;
  createdAt: string;
  decidedAt: string | null;
};

export type CardDecision = { card: PendingCard; turnRunning: boolean };

/** `reason`: a reject card's reason for the requester, as the user left it (confirm only). */
export function decideAssistantCard(
  cardId: string,
  decision: "confirm" | "decline",
  reason?: string
): Promise<CardDecision> {
  return api<CardDecision>(
    `/api/assistant/pending-actions/${encodeURIComponent(cardId)}/${decision}`,
    { method: "POST", body: reason === undefined ? {} : { reason } }
  );
}

export type AssistantChatDetail = { chat: AssistantChat; messages: DisplayMessage[] };

export function getAssistantOrganizations(): Promise<AssistantOrganizations> {
  return api<AssistantOrganizations>("/api/assistant/organizations");
}

export function getAssistantChats(): Promise<AssistantChat[]> {
  return api<{ chats: AssistantChat[] }>("/api/assistant/chats").then((r) => r.chats);
}

export function getAssistantChat(chatId: string): Promise<AssistantChatDetail> {
  return api<AssistantChatDetail>(`/api/assistant/chats/${encodeURIComponent(chatId)}`);
}

export function createAssistantChat(organizationId: string): Promise<AssistantChat> {
  return api<{ chat: AssistantChat }>("/api/assistant/chats", {
    method: "POST",
    body: { organizationId },
  }).then((r) => r.chat);
}

export function deleteAssistantChat(chatId: string): Promise<void> {
  return api<void>(`/api/assistant/chats/${encodeURIComponent(chatId)}`, { method: "DELETE" });
}

/**
 * What the panel's Assistant button does for the caller: open the chat when
 * any organization allows it; else show an owner or org admin of an Enterprise
 * organization that the Assistant is off; else show an owner without
 * Enterprise the upgrade prompt; else nothing.
 */
export type AssistantEntry =
  | { mode: "chat"; organizations: AssistantOrganization[]; leftOut: AssistantOrganization[] }
  | { mode: "off"; organization: AssistantOrganization }
  | { mode: "upgrade"; organization: AssistantOrganization }
  | { mode: "hidden" };

export function assistantEntry(organizations: AssistantOrganization[] | undefined): AssistantEntry {
  if (!organizations) return { mode: "hidden" };
  const eligible = organizations.filter((o) => o.eligible);
  if (eligible.length > 0) {
    return {
      mode: "chat",
      organizations: eligible,
      leftOut: organizations.filter((o) => !o.eligible && o.reason !== "NO_STANDING"),
    };
  }
  const off = organizations.find(
    (o) => o.reason === "TURNED_OFF" && o.planAllows && (o.role === "owner" || o.role === "admin")
  );
  if (off) return { mode: "off", organization: off };
  const upgrade = organizations.find((o) => !o.planAllows && o.role === "owner");
  if (upgrade) return { mode: "upgrade", organization: upgrade };
  return { mode: "hidden" };
}

export type ChatGroup = "today" | "thisWeek" | "earlier";

/** Today, since Monday of this week, or before it, in the viewer's time zone. */
export function chatGroup(lastMessageAt: string, now: Date = new Date()): ChatGroup {
  const at = new Date(lastMessageAt);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (at >= startOfToday) return "today";
  const sinceMonday = (startOfToday.getDay() + 6) % 7;
  const monday = new Date(startOfToday);
  monday.setDate(startOfToday.getDate() - sinceMonday);
  return at >= monday ? "thisWeek" : "earlier";
}

export type ToolStatus = "running" | "done" | "failed";

/** The chat stream's events, as `POST .../messages` and `GET .../stream` send them. */
export type ChatStreamEvent =
  | {
      event: "text";
      id: string | null;
      data: { delta: string } | { eventId: string; text: string };
    }
  | {
      event: "tool";
      id: string | null;
      data: { eventId: string; name: string | null; status: ToolStatus };
    }
  | { event: "card"; id: string | null; data: PendingCard }
  | { event: "error"; id: string | null; data: { code: string } }
  | { event: "done"; id: string | null; data: Record<string, never> };

const STREAM_EVENTS = new Set(["text", "tool", "card", "error", "done"]);

/** Splits server-sent events out of arriving chunks; `push` as text arrives. */
export function createStreamParser(onEvent: (event: ChatStreamEvent) => void) {
  let buffer = "";
  return {
    push(chunk: string) {
      buffer += chunk;
      let end = buffer.indexOf("\n\n");
      while (end !== -1) {
        const block = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        end = buffer.indexOf("\n\n");
        let event = "";
        let id: string | null = null;
        let data = "";
        for (const line of block.split("\n")) {
          if (line.startsWith("event: ")) event = line.slice(7);
          else if (line.startsWith("id: ")) id = line.slice(4);
          else if (line.startsWith("data: ")) data += line.slice(6);
        }
        if (!STREAM_EVENTS.has(event)) continue;
        onEvent({ event, id, data: JSON.parse(data || "{}") } as ChatStreamEvent);
      }
    },
  };
}

/**
 * Opens a chat stream and feeds its events to `onEvent` until it closes.
 * Answers whether `done` arrived; a stream cut short (App Runner's 120 s cut,
 * a network error) answers false, and the caller reconnects. A refusal before
 * the stream opens throws `ApiError`, as `api` does.
 */
async function readChatStream(
  path: string,
  init: RequestInit,
  onEvent: (event: ChatStreamEvent) => void
): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: { Accept: "text/event-stream", ...correlationHeaders(), ...init.headers },
  });
  if (!res.ok || !res.body) {
    let parsed: unknown = null;
    try {
      parsed = await res.json();
    } catch {
      parsed = null;
    }
    const errors = ((parsed as { errors?: ApiErrorEntry[] } | null)?.errors ?? []).filter(
      (e) => typeof e?.message === "string"
    );
    throw new ApiError(
      res.status,
      errors[0]?.message ?? `Request failed (${res.status})`,
      parsed,
      errors,
      {
        path,
      }
    );
  }
  let done = false;
  const parser = createStreamParser((event) => {
    if (event.event === "done") done = true;
    onEvent(event);
  });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  try {
    for (;;) {
      const { value, done: closed } = await reader.read();
      if (closed) break;
      parser.push(decoder.decode(value, { stream: true }));
    }
  } catch {
    return done;
  }
  return done;
}

export function sendAssistantMessage(
  chatId: string,
  text: string,
  onEvent: (event: ChatStreamEvent) => void,
  signal?: AbortSignal
): Promise<boolean> {
  return readChatStream(
    `/api/assistant/chats/${encodeURIComponent(chatId)}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal,
    },
    onEvent
  );
}

export function reconnectAssistantStream(
  chatId: string,
  after: string | null,
  onEvent: (event: ChatStreamEvent) => void,
  signal?: AbortSignal
): Promise<boolean> {
  const query = after ? `?after=${encodeURIComponent(after)}` : "";
  return readChatStream(
    `/api/assistant/chats/${encodeURIComponent(chatId)}/stream${query}`,
    { signal },
    onEvent
  );
}
