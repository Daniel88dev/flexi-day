import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import type { AssistantChat, AssistantOrganization, DisplayMessage } from "@/lib/api/assistant";
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
  };
});

const mocked = vi.mocked(api);

const org = (overrides: Partial<AssistantOrganization> = {}): AssistantOrganization => ({
  organizationId: "org-acme",
  organizationName: "Acme",
  eligible: true,
  reason: null,
  planAllows: true,
  role: "member",
  hasChats: true,
  weeklyLimit: null,
  ...overrides,
});

const chat = (overrides: Partial<AssistantChat> = {}): AssistantChat => ({
  id: "chat-1",
  organizationId: "org-acme",
  organizationName: "Acme",
  title: "Who's away next week?",
  createdAt: "2026-10-01T10:00:00.000Z",
  lastMessageAt: "2026-10-01T10:00:00.000Z",
  turnRunning: false,
  closed: null,
  ...overrides,
});

const messages: DisplayMessage[] = [
  {
    id: "m1",
    kind: "user",
    text: "Who's away next week?",
    toolName: null,
    toolOutcome: null,
    code: null,
    card: null,
    createdAt: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "m2",
    kind: "assistant",
    text: "Nobody is away next week.",
    toolName: null,
    toolOutcome: null,
    code: null,
    card: null,
    createdAt: "2026-10-01T10:00:01.000Z",
  },
];

const serve = (organizations: AssistantOrganization[], opened: AssistantChat = chat()) => {
  mocked.getAssistantOrganizations.mockResolvedValue({ organizations, providerUnavailable: false });
  mocked.getAssistantChats.mockResolvedValue([opened]);
  mocked.getAssistantChat.mockResolvedValue({ chat: opened, messages });
};

let czech = false;

const renderAssistant = () => {
  const ui = (
    <>
      <AssistantButton />
      <AssistantPanel />
    </>
  );
  return renderWithClient(czech ? <I18nProvider>{ui}</I18nProvider> : ui);
};

const openPanel = async () => {
  const name = czech ? "Asistent" : "Assistant";
  await userEvent.click(await screen.findByRole("button", { name }));
  return screen.findByRole("complementary", { name });
};

const openPastChat = async (panel: HTMLElement) => {
  await userEvent.click(
    await within(panel).findByRole("button", { name: czech ? "Tvoje chaty" : "Your chats" })
  );
  await userEvent.click(
    await within(panel).findByRole("button", { name: /^Who's away next week\?/ })
  );
  await within(panel).findByText("Nobody is away next week.");
};

const composer = (panel: HTMLElement) =>
  within(panel).queryByRole("textbox", { name: czech ? /Asistent/ : "Message the Assistant" });

beforeEach(() => {
  czech = false;
  window.localStorage.removeItem("flexiday-locale");
  act(() => setAssistantOpen(false));
  vi.clearAllMocks();
});

afterEach(() => {
  window.localStorage.removeItem("flexiday-locale");
});

describe("chat lifecycle in the Assistant panel", () => {
  it("should show a chat closed at its length limit as readable, with New chat in place of the composer", async () => {
    serve([org()], chat({ closed: "length" }));
    renderAssistant();
    const panel = await openPanel();
    await openPastChat(panel);

    const notice = within(panel).getByTestId("assistant-chat-closed");
    expect(notice.textContent).toContain("This chat is closed.");
    expect(notice.textContent).toContain("It reached its length limit. It stays here to read.");
    expect(composer(panel)).toBeNull();

    await userEvent.click(within(notice).getByRole("button", { name: "New chat" }));
    expect(
      await within(panel).findByRole("textbox", { name: "Message the Assistant" })
    ).toBeTruthy();
    expect(within(panel).queryByTestId("assistant-chat-closed")).toBeNull();
  });

  it("should give the reason for a chat closed after 30 days", async () => {
    serve([org()], chat({ closed: "idle" }));
    renderAssistant();
    const panel = await openPanel();
    await openPastChat(panel);

    expect(within(panel).getByTestId("assistant-chat-closed").textContent).toContain(
      "Nobody wrote in it for 30 days. It stays here to read."
    );
    expect(composer(panel)).toBeNull();
  });

  it("should keep an open chat's composer", async () => {
    serve([org()]);
    renderAssistant();
    const panel = await openPanel();
    await openPastChat(panel);

    expect(composer(panel)).toBeTruthy();
    expect(within(panel).queryByTestId("assistant-chat-closed")).toBeNull();
  });

  it("should keep a chat readable after the owner turned the Assistant off, refusing new messages", async () => {
    serve(
      [
        org({ organizationId: "org-beta", organizationName: "Beta", hasChats: false }),
        org({ eligible: false, reason: "TURNED_OFF" }),
      ],
      chat()
    );
    renderAssistant();
    const panel = await openPanel();
    await openPastChat(panel);

    expect(within(panel).getByTestId("assistant-read-only").textContent).toBe(
      "The Assistant is off for Acme. This chat stays here to read."
    );
    expect(composer(panel)).toBeNull();
  });

  it("should keep the panel open to a member whose only organization's plan lapsed, chats readable", async () => {
    serve([org({ eligible: false, reason: "PLAN", planAllows: false })]);
    renderAssistant();
    const panel = await openPanel();

    expect(await within(panel).findByTestId("assistant-read-only")).toBeTruthy();
    expect(composer(panel)).toBeNull();

    await openPastChat(panel);
    expect(within(panel).getByTestId("assistant-read-only").textContent).toBe(
      "Acme's plan no longer includes the Assistant. This chat stays here to read."
    );
    expect(composer(panel)).toBeNull();
  });

  it("should hide the button from a member whose only organization lapsed when they have no chats", async () => {
    serve([org({ eligible: false, reason: "PLAN", planAllows: false, hasChats: false })]);
    renderAssistant();
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByRole("button", { name: "Assistant" })).toBeNull();
  });

  describe("in Czech", () => {
    beforeEach(() => {
      czech = true;
      window.localStorage.setItem("flexiday-locale", "cs");
    });

    it("should show the closed chat", async () => {
      serve([org()], chat({ closed: "idle" }));
      renderAssistant();
      const panel = await openPanel();
      await openPastChat(panel);

      const notice = within(panel).getByTestId("assistant-chat-closed");
      expect(notice.textContent).toContain("Tento chat je uzavřený.");
      expect(notice.textContent).toContain("30 dní do něj nikdo nenapsal. Číst si ho můžeš dál.");
      expect(within(notice).getByRole("button", { name: "Nový chat" })).toBeTruthy();
    });

    it("should show the read-only chat with the Assistant off", async () => {
      serve([org({ eligible: false, reason: "TURNED_OFF" })]);
      renderAssistant();
      const panel = await openPanel();
      await openPastChat(panel);

      expect(within(panel).getByTestId("assistant-read-only").textContent).toBe(
        "Asistent je v organizaci Acme vypnutý. Tento chat si můžeš dál číst."
      );
    });
  });
});
