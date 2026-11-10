import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import type { AssistantChat, ChatStreamEvent, DisplayMessage } from "@/lib/api/assistant";
import * as api from "@/lib/api/assistant";
import { cs } from "@/lib/i18n/dictionaries/cs";
import { en } from "@/lib/i18n/dictionaries/en";
import { AssistantButton, AssistantPanel } from "../assistant-panel";
import { setAssistantOpen } from "../assistant-store";
import { MessageList, noticeText } from "../chat-parts";

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
  };
});

const mocked = vi.mocked(api);

const chat = (overrides: Partial<AssistantChat> = {}): AssistantChat => ({
  id: "chat-1",
  organizationId: "org-acme",
  organizationName: "Acme",
  title: null,
  createdAt: "2026-11-11T10:00:00.000Z",
  lastMessageAt: "2026-11-11T10:00:00.000Z",
  turnRunning: false,
  closed: null,
  ...overrides,
});

const row = (overrides: Partial<DisplayMessage>): DisplayMessage => ({
  id: "m",
  card: null,
  kind: "user",
  text: null,
  toolName: null,
  toolOutcome: null,
  code: null,
  createdAt: "2026-11-11T10:00:00.000Z",
  ...overrides,
});

const TOPIC_REFUSAL =
  "I can only help with Flexi Day: time off, attendance, your team and how the app works. For legal or HR questions, ask your HR team or employer.";

const openAndSend = async (text: string) => {
  renderWithClient(
    <>
      <AssistantButton />
      <AssistantPanel />
    </>
  );
  await userEvent.click(await screen.findByRole("button", { name: "Assistant" }));
  const panel = await screen.findByRole("complementary", { name: "Assistant" });
  await userEvent.type(
    within(panel).getByRole("textbox", { name: "Message the Assistant" }),
    `${text}{Enter}`
  );
  return panel;
};

const screenFailed = () =>
  new ApiError(503, "Your message couldn't be checked, so it wasn't sent", null, [
    { message: "x", context: { code: "ASSISTANT_SCREEN_FAILED" } },
  ]);

beforeEach(() => {
  act(() => setAssistantOpen(false));
  vi.clearAllMocks();
  mocked.getAssistantChats.mockResolvedValue([]);
  mocked.getAssistantOrganizations.mockResolvedValue({
    organizations: [
      {
        organizationId: "org-acme",
        organizationName: "Acme",
        eligible: true,
        reason: null,
        planAllows: true,
        role: "member",
        hasChats: false,
        weeklyLimit: null,
      },
    ],
    providerUnavailable: false,
  });
  mocked.createAssistantChat.mockResolvedValue(chat());
});

describe("the topic boundary in the panel", () => {
  it("should keep a rejected message in the chat with the fixed topic refusal", async () => {
    mocked.getAssistantChat.mockResolvedValue({
      chat: chat({ title: "What's the weather?" }),
      messages: [
        row({ id: "m1", kind: "user", text: "What's the weather?", code: "REJECTED" }),
        row({ id: "m2", kind: "notice", code: "ASSISTANT_TOPIC_REFUSAL" }),
      ],
    });
    mocked.sendAssistantMessage.mockImplementation(
      (_chatId: string, _text: string, onEvent: (event: ChatStreamEvent) => void) => {
        onEvent({ event: "error", id: null, data: { code: "ASSISTANT_TOPIC_REFUSAL" } });
        onEvent({ event: "done", id: null, data: {} });
        return Promise.resolve(true);
      }
    );

    const panel = await openAndSend("What's the weather?");

    expect(await within(panel).findByText(TOPIC_REFUSAL)).toBeTruthy();
    await waitFor(() => expect(within(panel).getByText("Not sent to the Assistant")).toBeTruthy());
    expect(within(panel).getAllByText("What's the weather?").length).toBeGreaterThan(0);
  });

  it("should offer Try again when the screen failed, and send the same text again", async () => {
    mocked.getAssistantChat.mockResolvedValue({ chat: chat(), messages: [] });
    mocked.sendAssistantMessage.mockRejectedValueOnce(screenFailed());
    mocked.sendAssistantMessage.mockResolvedValueOnce(true);

    const panel = await openAndSend("Who is away next week?");

    expect((await within(panel).findByRole("alert")).textContent).toBe(
      "Your message couldn't be checked, so it wasn't sent."
    );
    await userEvent.click(within(panel).getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(mocked.sendAssistantMessage).toHaveBeenCalledTimes(2));
    expect(mocked.sendAssistantMessage.mock.calls[1]![1]).toBe("Who is away next week?");
  });

  it("should offer Send again when a message didn't go out", async () => {
    mocked.getAssistantChat.mockResolvedValue({ chat: chat(), messages: [] });
    mocked.sendAssistantMessage.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const panel = await openAndSend("Hello");

    expect((await within(panel).findByRole("alert")).textContent).toBe(
      "Not sent. Check your connection and try again."
    );
    expect(within(panel).getByRole("button", { name: "Send again" })).toBeTruthy();
  });

  it("should say the Assistant is unavailable, with no button to resend", async () => {
    mocked.getAssistantChat.mockResolvedValue({ chat: chat(), messages: [] });
    mocked.sendAssistantMessage.mockRejectedValueOnce(
      new ApiError(503, "The Assistant is unavailable right now", null, [
        { message: "x", context: { code: "ASSISTANT_UNAVAILABLE" } },
      ])
    );

    const panel = await openAndSend("Hello");

    expect((await within(panel).findByRole("alert")).textContent).toBe(
      "The Assistant is unavailable right now. Try again later."
    );
    expect(within(panel).queryByRole("button", { name: /again/ })).toBeNull();
  });
});

describe("MessageList", () => {
  it("should show the model's own refusal as the fixed message", () => {
    render(
      <MessageList
        messages={[
          row({ id: "m1", kind: "user", text: "Tell me something" }),
          row({ id: "m2", kind: "notice", code: "ASSISTANT_MODEL_REFUSAL" }),
        ]}
        live={null}
        failed={null}
        organizationName="Acme"
      />
    );
    expect(
      screen.getByText(
        "The Assistant can't answer that. Ask about time off, attendance or your team."
      )
    ).toBeTruthy();
  });
});

describe("noticeText", () => {
  it("should have every fixed message and the AI line in English and Czech", () => {
    const codes = [
      "ASSISTANT_ERROR",
      "ASSISTANT_TOPIC_REFUSAL",
      "ASSISTANT_MODEL_REFUSAL",
      "ASSISTANT_WEEKLY_LIMIT_REACHED",
      "ASSISTANT_STEP_LIMIT",
      "ASSISTANT_UNAVAILABLE",
    ] as const;
    for (const code of codes) {
      expect(noticeText(en, code, "Acme")).toBeTruthy();
      expect(noticeText(cs, code, "Acme")).toBeTruthy();
      expect(noticeText(cs, code, "Acme")).not.toBe(noticeText(en, code, "Acme"));
    }
    expect(noticeText(en, "SOMETHING_NEW", "Acme")).toBe(en.assistant.notices.ASSISTANT_ERROR);
    expect(cs.assistantBoundary.notices.ASSISTANT_TOPIC_REFUSAL).toContain("Flexi Day");
    expect([cs.assistantBoundary.tryAgain, cs.assistantBoundary.sendAgain]).toEqual([
      "Zkusit znovu",
      "Odeslat znovu",
    ]);
    expect(cs.assistantBoundary.unavailable).toBe(
      "Asistent teď není k dispozici. Zkus to později."
    );
    expect(en.assistant.aiLine).toBe(
      "The Assistant is an AI. Answers can be wrong. Nothing changes until you confirm it."
    );
    expect(cs.assistant.aiLine).toBe(
      "Asistent je AI. Může se mýlit. Nic se nezmění, dokud to nepotvrdíš."
    );
  });
});
