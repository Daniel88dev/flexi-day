import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import type {
  AssistantChat,
  AssistantChatDetail,
  AssistantOrganization,
  ChatStreamEvent,
} from "@/lib/api/assistant";
import * as api from "@/lib/api/assistant";
import { AssistantButton, AssistantPanel } from "../assistant-panel";
import { setAssistantOpen } from "../assistant-store";

let available = true;
vi.mock("@/lib/api/queries", () => ({
  useAiAvailability: () => ({
    data: { assistant: available, aiConnections: false, organizations: [] },
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
  };
});

const mocked = vi.mocked(api);

const organization = (overrides: Partial<AssistantOrganization>): AssistantOrganization => ({
  organizationId: "org-acme",
  organizationName: "Acme",
  eligible: true,
  reason: null,
  planAllows: true,
  role: "member",
  weeklyLimit: null,
  ...overrides,
});

const orgs = (...organizations: AssistantOrganization[]) => ({
  organizations,
  providerUnavailable: false,
});

const acme = organization({});
const beta = organization({
  organizationId: "org-beta",
  organizationName: "Beta",
  eligible: false,
  reason: "PLAN",
  planAllows: false,
});

const chat = (overrides: Partial<AssistantChat> = {}): AssistantChat => ({
  id: "chat-1",
  organizationId: "org-acme",
  organizationName: "Acme",
  title: "How many days do I have left?",
  createdAt: "2026-11-11T10:00:00.000Z",
  lastMessageAt: "2026-11-11T10:00:00.000Z",
  turnRunning: false,
  ...overrides,
});

const answered: AssistantChatDetail = {
  chat: chat(),
  messages: [
    {
      id: "m1",
      kind: "user",
      text: "How many days do I have left?",
      toolName: null,
      toolOutcome: null,
      code: null,
      createdAt: "2026-11-11T10:00:00.000Z",
    },
    {
      id: "m2",
      kind: "tool",
      text: null,
      toolName: "get_my_balances",
      toolOutcome: "ok",
      code: null,
      createdAt: "2026-11-11T10:00:01.000Z",
    },
    {
      id: "m3",
      kind: "assistant",
      text: "You have **12** days left.",
      toolName: null,
      toolOutcome: null,
      code: null,
      createdAt: "2026-11-11T10:00:02.000Z",
    },
  ],
};

/** A stream the test drives: emit events, then end it with or without `done`. */
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

const renderAssistant = () =>
  renderWithClient(
    <>
      <AssistantButton />
      <AssistantPanel />
    </>
  );

const openPanel = async () => {
  await userEvent.click(await screen.findByRole("button", { name: "Assistant" }));
  return screen.findByRole("complementary", { name: "Assistant" });
};

beforeEach(() => {
  available = true;
  act(() => setAssistantOpen(false));
  vi.clearAllMocks();
  mocked.getAssistantChats.mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AssistantButton", () => {
  it("should stay hidden from a member when no organization offers the Assistant", async () => {
    mocked.getAssistantOrganizations.mockResolvedValue(
      orgs(
        { ...beta, role: "member" },
        organization({ eligible: false, reason: "TURNED_OFF", role: "member" })
      )
    );
    renderAssistant();
    await waitFor(() => expect(mocked.getAssistantOrganizations).toHaveBeenCalled());
    await act(async () => {});
    expect(screen.queryByRole("button", { name: "Assistant" })).toBeNull();
  });

  it("should stay hidden while the Assistant is switched off, without asking for organizations", async () => {
    available = false;
    mocked.getAssistantOrganizations.mockResolvedValue(orgs(acme));
    renderAssistant();
    await act(async () => {});
    expect(screen.queryByRole("button", { name: "Assistant" })).toBeNull();
    expect(mocked.getAssistantOrganizations).not.toHaveBeenCalled();
  });

  it("should open the upgrade prompt for an owner without Enterprise", async () => {
    mocked.getAssistantOrganizations.mockResolvedValue(orgs({ ...beta, role: "owner" }));
    renderAssistant();
    const panel = await openPanel();
    expect(
      within(panel).getByRole("heading", { name: "The Assistant comes with Enterprise" })
    ).toBeTruthy();
    expect(within(panel).getByRole("link", { name: "See Enterprise" }).getAttribute("href")).toBe(
      "/billing"
    );
  });

  it("should tell an org admin the Assistant is off, with the way to the settings", async () => {
    mocked.getAssistantOrganizations.mockResolvedValue(
      orgs(
        organization({
          organizationName: "Gamma",
          eligible: false,
          reason: "TURNED_OFF",
          role: "admin",
        })
      )
    );
    renderAssistant();
    const panel = await openPanel();
    expect(
      within(panel).getByRole("heading", { name: "The Assistant is off for Gamma" })
    ).toBeTruthy();
    expect(
      within(panel).getByRole("link", { name: "Open organization settings" }).getAttribute("href")
    ).toBe("/organization");
  });
});

describe("AssistantPanel", () => {
  beforeEach(() => {
    mocked.getAssistantOrganizations.mockResolvedValue(orgs(acme, beta));
  });

  it("should show loading while the organizations load", async () => {
    mocked.getAssistantOrganizations.mockReturnValue(new Promise(() => {}));
    act(() => setAssistantOpen(true));
    renderAssistant();
    expect(await screen.findByLabelText("Opening chat")).toBeTruthy();
  });

  it("should open a new chat with suggestions, the AI line and the organization picker", async () => {
    renderAssistant();
    const panel = await openPanel();
    expect(
      within(panel).getByRole("heading", { name: "Ask about time off, attendance or your team" })
    ).toBeTruthy();
    expect(within(panel).getByRole("button", { name: /Who's away next week\?/ })).toBeTruthy();
    expect(
      within(panel).getByText(
        "The Assistant is an AI. Answers can be wrong. Nothing changes until you confirm it."
      )
    ).toBeTruthy();

    const [picker] = within(panel).getAllByRole("button", { name: "Acme" });
    await userEvent.click(picker!);
    expect(within(panel).getByRole("option", { name: "Acme" })).toBeTruthy();
    expect(
      within(panel).getByText("Beta isn't listed: the Assistant needs Enterprise.")
    ).toBeTruthy();
  });

  it("should stream an answer with its step line, keep the composer off, and lock the organization", async () => {
    const stream = controlledStream();
    mocked.createAssistantChat.mockResolvedValue(chat({ title: null }));
    mocked.sendAssistantMessage.mockImplementation(stream.impl);
    mocked.getAssistantChat.mockResolvedValue({
      chat: chat({ turnRunning: true, title: "How many days do I have left?" }),
      // The new chat's record already holds the message being answered.
      messages: [answered.messages[0]!],
    });

    renderAssistant();
    const panel = await openPanel();
    await userEvent.type(
      within(panel).getByRole("textbox", { name: "Message the Assistant" }),
      "How many days do I have left?{Enter}"
    );

    await waitFor(() => expect(mocked.sendAssistantMessage).toHaveBeenCalled());
    await waitFor(() => expect(mocked.getAssistantChat).toHaveBeenCalled());
    // Once in the header, once as the bubble.
    await waitFor(() =>
      expect(within(panel).getAllByText("How many days do I have left?")).toHaveLength(2)
    );
    expect(mocked.createAssistantChat).toHaveBeenCalledWith("org-acme");
    expect(
      (within(panel).getByRole("textbox", { name: "Message the Assistant" }) as HTMLTextAreaElement)
        .disabled
    ).toBe(true);
    expect(within(panel).queryByRole("button", { name: "Acme" })).toBeNull();

    stream.emit({
      event: "tool",
      id: "sevt_1",
      data: { eventId: "sevt_1", name: "get_my_balances", status: "running" },
    });
    expect(within(panel).getByRole("status").textContent).toContain("Checking your balance");
    stream.emit({
      event: "tool",
      id: "sevt_2",
      data: { eventId: "sevt_1", name: "get_my_balances", status: "done" },
    });
    stream.emit({ event: "text", id: null, data: { delta: "You have 12" } });
    expect(within(panel).getByText("Checked your balance")).toBeTruthy();
    expect(within(panel).getByText("You have 12")).toBeTruthy();

    mocked.getAssistantChat.mockResolvedValue(answered);
    stream.emit({
      event: "text",
      id: "sevt_3",
      data: { eventId: "sevt_3", text: "You have **12** days left." },
    });
    stream.emit({ event: "done", id: null, data: {} });
    await stream.end(true);

    await waitFor(() =>
      expect(
        (
          within(panel).getByRole("textbox", {
            name: "Message the Assistant",
          }) as HTMLTextAreaElement
        ).disabled
      ).toBe(false)
    );
    expect(within(panel).getByText("12").tagName).toBe("STRONG");
    expect(within(panel).getByTestId("assistant-steps").textContent).toBe("Checked your balance");
  });

  it("should say it is still writing and reconnect from the last event when the stream is cut", async () => {
    const first = controlledStream();
    const again = controlledStream();
    mocked.createAssistantChat.mockResolvedValue(chat({ title: null }));
    mocked.sendAssistantMessage.mockImplementation(first.impl);
    mocked.reconnectAssistantStream.mockImplementation(again.impl);
    mocked.getAssistantChat.mockResolvedValue({ chat: chat({ turnRunning: true }), messages: [] });

    renderAssistant();
    const panel = await openPanel();
    await userEvent.click(within(panel).getByRole("button", { name: /Who's away next week\?/ }));
    await waitFor(() => expect(mocked.sendAssistantMessage).toHaveBeenCalled());
    first.emit({
      event: "tool",
      id: "sevt_7",
      data: { eventId: "sevt_7", name: "list_who_is_away", status: "running" },
    });
    await first.end(false);

    await waitFor(() =>
      expect(mocked.reconnectAssistantStream).toHaveBeenCalledWith(
        "chat-1",
        "sevt_7",
        expect.any(Function),
        expect.anything()
      )
    );
    expect(within(panel).getByRole("status").textContent).toContain(
      "Still writing. The full answer appears in a moment."
    );

    mocked.getAssistantChat.mockResolvedValue(answered);
    again.emit({ event: "done", id: null, data: {} });
    await again.end(true);
    await waitFor(() => expect(within(panel).queryByRole("status")).toBeNull());
  });

  it("should reconnect to an answer still running when a chat opens", async () => {
    const stream = controlledStream();
    mocked.getAssistantChats.mockResolvedValue([chat({ turnRunning: true })]);
    mocked.getAssistantChat.mockResolvedValue({ ...answered, chat: chat({ turnRunning: true }) });
    mocked.reconnectAssistantStream.mockImplementation(stream.impl);

    renderAssistant();
    const panel = await openPanel();
    await userEvent.click(within(panel).getByRole("button", { name: "Your chats" }));
    await userEvent.click(
      await within(panel).findByRole("button", { name: /^How many days do I have left\?/ })
    );

    await waitFor(() =>
      expect(mocked.reconnectAssistantStream).toHaveBeenCalledWith(
        "chat-1",
        null,
        expect.any(Function),
        expect.anything()
      )
    );
    expect(
      within(panel).getByText("Still writing. The full answer appears in a moment.")
    ).toBeTruthy();
    await stream.end(true);
  });

  it("should show why a message wasn't sent", async () => {
    mocked.createAssistantChat.mockResolvedValue(chat({ title: null }));
    mocked.getAssistantChat.mockResolvedValue({ chat: chat(), messages: [] });
    mocked.sendAssistantMessage.mockRejectedValue(
      new ApiError(409, "Another answer is still being written", null, [
        { message: "x", context: { code: "ASSISTANT_TURN_RUNNING" } },
      ])
    );

    renderAssistant();
    const panel = await openPanel();
    await userEvent.type(
      within(panel).getByRole("textbox", { name: "Message the Assistant" }),
      "Hello{Enter}"
    );
    expect((await within(panel).findByRole("alert")).textContent).toBe(
      "Another answer is still being written. Wait for it to finish."
    );
  });

  it("should group past chats by Today, This week and Earlier, and delete after a confirm", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 11, 15, 0));
    mocked.getAssistantChats.mockResolvedValue([
      chat({
        id: "c1",
        title: "Today's chat",
        lastMessageAt: new Date(2026, 10, 11, 9).toISOString(),
      }),
      chat({
        id: "c2",
        title: "Monday's chat",
        lastMessageAt: new Date(2026, 10, 9, 9).toISOString(),
      }),
      chat({ id: "c3", title: "Old chat", lastMessageAt: new Date(2026, 9, 20, 9).toISOString() }),
    ]);
    mocked.deleteAssistantChat.mockResolvedValue(undefined);

    renderAssistant();
    const panel = await openPanel();
    await userEvent.click(within(panel).getByRole("button", { name: "Your chats" }));

    const group = (name: string) => within(panel).findByRole("region", { name });
    expect(within(await group("Today")).getByText("Today's chat")).toBeTruthy();
    expect(within(await group("This week")).getByText("Monday's chat")).toBeTruthy();
    expect(within(await group("Earlier")).getByText("Old chat")).toBeTruthy();

    await userEvent.click(within(panel).getByRole("button", { name: "Delete Old chat" }));
    expect(within(panel).getByText("Delete “Old chat”? It can't be brought back.")).toBeTruthy();
    expect(mocked.deleteAssistantChat).not.toHaveBeenCalled();
    await userEvent.click(within(panel).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mocked.deleteAssistantChat).toHaveBeenCalled());
    expect(mocked.deleteAssistantChat.mock.calls[0]![0]).toBe("c3");
  });

  it("should close from its header", async () => {
    renderAssistant();
    const panel = await openPanel();
    await userEvent.click(within(panel).getByRole("button", { name: "Close the Assistant" }));
    expect(screen.queryByRole("complementary", { name: "Assistant" })).toBeNull();
  });
});
