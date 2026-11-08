import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import type {
  AssistantChat,
  AssistantOrganization,
  ChatStreamEvent,
  DisplayMessage,
  PendingCard,
} from "@/lib/api/assistant";
import * as api from "@/lib/api/assistant";
import { AssistantButton, AssistantPanel } from "../assistant-panel";
import { setAssistantOpen } from "../assistant-store";

vi.mock("@/lib/api/queries", () => ({
  useAiAvailability: () => ({
    data: { assistant: true, aiConnections: false, organizations: [] },
  }),
}));

vi.mock("@/lib/api/assistant", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/assistant")>();
  return {
    ...actual,
    getAssistantOrganizations: vi.fn(),
    getAssistantChats: vi.fn(),
    getAssistantChat: vi.fn(),
    createAssistantChat: vi.fn(),
    deleteAssistantChat: vi.fn(),
    sendAssistantMessage: vi.fn(),
    reconnectAssistantStream: vi.fn(),
    decideAssistantCard: vi.fn(),
  };
});

const mocked = vi.mocked(api);

const acme: AssistantOrganization = {
  organizationId: "org-acme",
  organizationName: "Acme",
  eligible: true,
  reason: null,
  planAllows: true,
  role: "member",
  weeklyLimit: null,
};

const chat = (overrides: Partial<AssistantChat> = {}): AssistantChat => ({
  id: "chat-1",
  organizationId: "org-acme",
  organizationName: "Acme",
  title: "Clock me in",
  createdAt: "2026-11-11T10:00:00.000Z",
  lastMessageAt: "2026-11-11T10:00:00.000Z",
  turnRunning: false,
  ...overrides,
});

const clockIn = (overrides: Partial<PendingCard> = {}): PendingCard => ({
  id: "card-1",
  chatId: "chat-1",
  toolUseId: "sevt_tool",
  tool: "clock_in",
  status: "open",
  preview: {
    action: "clock_in",
    at: "2026-11-11T07:52:00.000Z",
    businessDate: "2026-11-11",
    timezone: "Europe/Prague",
  },
  authorNames: [],
  result: null,
  error: null,
  createdAt: "2026-11-11T10:00:01.000Z",
  decidedAt: null,
  ...overrides,
});

const row = (id: string, overrides: Partial<DisplayMessage>): DisplayMessage => ({
  id,
  kind: "user",
  text: null,
  toolName: null,
  toolOutcome: null,
  code: null,
  card: null,
  createdAt: "2026-11-11T10:00:00.000Z",
  ...overrides,
});

const record = (card: PendingCard, extra: DisplayMessage[] = []) => ({
  chat: chat(),
  messages: [
    row("m1", { kind: "user", text: "Clock me in" }),
    row("m2", { kind: "tool", toolName: "clock_in", toolOutcome: "card", card }),
    ...extra,
  ],
});

function controlledStream() {
  let emit: (event: ChatStreamEvent) => void = () => {};
  let end: (done: boolean) => void = () => {};
  const impl = (_chatId: string, _arg: unknown, onEvent: (e: ChatStreamEvent) => void) => {
    emit = onEvent;
    return new Promise<boolean>((resolve) => {
      end = resolve;
    });
  };
  return {
    impl,
    emit: (event: ChatStreamEvent) => act(() => emit(event)),
    end: (done: boolean) => act(() => end(done)),
  };
}

const openChat = async () => {
  renderWithClient(
    <>
      <AssistantButton />
      <AssistantPanel />
    </>
  );
  await userEvent.click(await screen.findByRole("button", { name: "Assistant" }));
  const panel = await screen.findByRole("complementary", { name: "Assistant" });
  await userEvent.click(within(panel).getByRole("button", { name: "Your chats" }));
  await userEvent.click(await within(panel).findByRole("button", { name: /^Clock me in/ }));
  return panel;
};

beforeEach(() => {
  act(() => setAssistantOpen(false));
  vi.clearAllMocks();
  mocked.getAssistantOrganizations.mockResolvedValue({
    organizations: [acme],
    providerUnavailable: false,
  });
  mocked.getAssistantChats.mockResolvedValue([chat()]);
});

describe("cards in the Assistant panel", () => {
  it("should show a card from the display record in place of its tool line", async () => {
    mocked.getAssistantChat.mockResolvedValue(record(clockIn()));
    const panel = await openChat();
    const card = await within(panel).findByTestId("assistant-card");
    expect(within(card).getByText("Clock in now?")).toBeInTheDocument();
    expect(within(panel).queryByText("Preparing your clock-in")).toBeNull();
    // The composer stays free while a card waits.
    expect(
      (within(panel).getByRole("textbox", { name: "Message the Assistant" }) as HTMLTextAreaElement)
        .disabled
    ).toBe(false);
  });

  it("should follow the Assistant's answer after a confirm that sent the results", async () => {
    const stream = controlledStream();
    mocked.getAssistantChat.mockResolvedValue(record(clockIn()));
    mocked.reconnectAssistantStream.mockImplementation(stream.impl);
    mocked.decideAssistantCard.mockResolvedValue({
      card: clockIn({ status: "confirmed", result: { startedAt: "2026-11-11T07:53:00.000Z" } }),
      turnRunning: true,
    });
    const panel = await openChat();

    await userEvent.click(await within(panel).findByRole("button", { name: "Clock in" }));
    await waitFor(() =>
      expect(mocked.reconnectAssistantStream).toHaveBeenCalledWith(
        "chat-1",
        null,
        expect.any(Function),
        expect.anything()
      )
    );
    expect(within(panel).getByTestId("assistant-card")).toHaveTextContent("Clocked in at 08:53");
    stream.emit({ event: "text", id: "sevt_9", data: { eventId: "sevt_9", text: "Done." } });
    expect(within(panel).getByText("Done.")).toBeInTheDocument();
    await stream.end(true);
  });

  it("should not follow anything when the decision sent no results", async () => {
    mocked.getAssistantChat.mockResolvedValue(record(clockIn()));
    mocked.decideAssistantCard.mockResolvedValue({
      card: clockIn({ status: "declined" }),
      turnRunning: false,
    });
    const panel = await openChat();
    await userEvent.click(await within(panel).findByRole("button", { name: "Not now" }));
    await waitFor(() =>
      expect(within(panel).getByTestId("assistant-card")).toHaveAttribute("data-status", "declined")
    );
    expect(mocked.reconnectAssistantStream).not.toHaveBeenCalled();
  });

  it("should show a card the stream sends during a live answer", async () => {
    const stream = controlledStream();
    mocked.getAssistantChat.mockResolvedValue({
      chat: chat(),
      messages: [row("m1", { kind: "user", text: "Clock me in" })],
    });
    mocked.sendAssistantMessage.mockImplementation(stream.impl);
    const panel = await openChat();
    await userEvent.type(
      within(panel).getByRole("textbox", { name: "Message the Assistant" }),
      "And clock me in{Enter}"
    );
    await waitFor(() => expect(mocked.sendAssistantMessage).toHaveBeenCalled());
    stream.emit({
      event: "tool",
      id: "sevt_tool",
      data: { eventId: "sevt_tool", name: "clock_in", status: "running" },
    });
    expect(within(panel).getByRole("status")).toHaveTextContent("Preparing your clock-in");
    stream.emit({ event: "card", id: null, data: clockIn() });
    expect(within(panel).getByTestId("assistant-card")).toHaveTextContent("Clock in now?");
    expect(within(panel).queryByRole("status")).toBeNull();
    stream.emit({ event: "done", id: null, data: {} });
    await stream.end(true);
  });
});
