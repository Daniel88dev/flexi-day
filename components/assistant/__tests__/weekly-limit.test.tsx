import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import type {
  AssistantChat,
  AssistantChatDetail,
  AssistantOrganization,
  ChatStreamEvent,
  DisplayMessage,
  WeeklyLimitState,
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
  };
});

const mocked = vi.mocked(api);

// Monday 16 Nov 2026 00:00 UTC; the tests run in America/Los_Angeles, where it is Sunday afternoon.
const RESETS_AT = "2026-11-16T00:00:00.000Z";

const limit = (overrides: Partial<WeeklyLimitState>): WeeklyLimitState => ({
  percent: 0,
  reached: false,
  resetsAt: RESETS_AT,
  usedMicroUsd: null,
  limitMicroUsd: null,
  ...overrides,
});

const acme = (role: AssistantOrganization["role"], weeklyLimit: WeeklyLimitState) => ({
  organizationId: "org-acme",
  organizationName: "Acme",
  eligible: true,
  reason: null,
  planAllows: true,
  role,
  weeklyLimit,
});

const serve = (organization: AssistantOrganization, providerUnavailable = false) =>
  mocked.getAssistantOrganizations.mockResolvedValue({
    organizations: [organization],
    providerUnavailable,
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

const row = (id: string, overrides: Partial<DisplayMessage>): DisplayMessage => ({
  id,
  kind: "user",
  text: null,
  toolName: null,
  toolOutcome: null,
  code: null,
  createdAt: "2026-11-11T10:00:00.000Z",
  ...overrides,
});

/** A turn the Weekly limit stopped after the Assistant's first words, as the display record keeps it. */
const stopped: AssistantChatDetail = {
  chat: chat(),
  messages: [
    row("m1", { kind: "user", text: "How many days do I have left?" }),
    row("m2", { kind: "assistant", text: "Let me look at your balance." }),
    row("m3", { kind: "tool", toolName: "get_my_balances", toolOutcome: "stopped" }),
    row("m4", { kind: "notice", code: "ASSISTANT_WEEKLY_LIMIT_REACHED" }),
  ],
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
  mocked.getAssistantChats.mockResolvedValue([chat()]);
  await userEvent.click(
    within(panel).getByRole("button", { name: czech ? "Tvoje chaty" : "Your chats" })
  );
  await userEvent.click(
    await within(panel).findByRole("button", { name: /^How many days do I have left\?/ })
  );
};

beforeEach(() => {
  czech = false;
  window.localStorage.removeItem("flexiday-locale");
  act(() => setAssistantOpen(false));
  vi.clearAllMocks();
  mocked.getAssistantChats.mockResolvedValue([]);
});

afterEach(() => {
  window.localStorage.removeItem("flexiday-locale");
});

describe("the Weekly limit in the Assistant panel", () => {
  it("should show a member the near-limit bar from 80%, as a percentage with the reset in their time zone", async () => {
    serve(acme("member", limit({ percent: 86 })));
    renderAssistant();
    const panel = await openPanel();

    const note = await within(panel).findByTestId("assistant-near-limit");
    expect(note.textContent).toBe(
      "Acme has used 86% of this week's Assistant limit. It resets Sunday 15 Nov, 16:00."
    );
    expect(note.textContent).not.toContain("$");
    expect(within(note).getByRole("progressbar").getAttribute("aria-valuenow")).toBe("86");
    expect(within(panel).getByRole("textbox", { name: "Message the Assistant" })).toBeTruthy();
  });

  it("should show owners and org admins the amounts beside the percentage", async () => {
    serve(
      acme("admin", limit({ percent: 86, usedMicroUsd: 8_600_000, limitMicroUsd: 10_000_000 }))
    );
    renderAssistant();
    const panel = await openPanel();

    expect((await within(panel).findByTestId("assistant-near-limit")).textContent).toBe(
      "Acme has used $8.60 of its $10 Assistant limit this week (86%). It resets Sunday 15 Nov, 16:00."
    );
  });

  it("should show no bar below 80%", async () => {
    serve(acme("member", limit({ percent: 79 })));
    renderAssistant();
    const panel = await openPanel();

    await within(panel).findByRole("textbox", { name: "Message the Assistant" });
    expect(within(panel).queryByTestId("assistant-near-limit")).toBeNull();
  });

  it("should replace the composer with the paused notice once the limit is reached, without See usage for members", async () => {
    serve(acme("member", limit({ percent: 99, reached: true })));
    renderAssistant();
    const panel = await openPanel();

    const notice = await within(panel).findByRole("status");
    expect(notice.textContent).toBe(
      "The Assistant is paused until Sunday 15 Nov, 16:00. Acme reached this week's limit. Your chats stay here to read, and requests already shown can still be sent."
    );
    expect(within(panel).queryByRole("textbox", { name: "Message the Assistant" })).toBeNull();
    expect(within(panel).queryByRole("link", { name: "See usage" })).toBeNull();

    await userEvent.click(within(panel).getByRole("button", { name: /Who's away next week\?/ }));
    expect(mocked.createAssistantChat).not.toHaveBeenCalled();
    expect(mocked.sendAssistantMessage).not.toHaveBeenCalled();
  });

  it("should give owners and org admins See usage at the limit", async () => {
    serve(
      acme(
        "owner",
        limit({ percent: 100, reached: true, usedMicroUsd: 10_000_000, limitMicroUsd: 10_000_000 })
      )
    );
    renderAssistant();
    const panel = await openPanel();

    const link = await within(panel).findByRole("link", { name: "See usage" });
    expect(link.getAttribute("href")).toBe("/ai-usage");
  });

  it("should keep an answer stopped mid-way and end it with the fixed limit line", async () => {
    serve(acme("member", limit({ percent: 100, reached: true })));
    mocked.getAssistantChat.mockResolvedValue(stopped);
    renderAssistant();
    const panel = await openPanel();
    await openPastChat(panel);

    expect(await within(panel).findByText("Let me look at your balance.")).toBeTruthy();
    expect(
      within(panel).getByText("Stopped here: Acme reached this week's Assistant limit.")
    ).toBeTruthy();
    expect(within(panel).queryByText("Couldn't check your balance")).toBeNull();
    expect(within(panel).queryByTestId("assistant-steps")).toBeNull();
  });

  it("should show the limit line as soon as the stream stops the answer", async () => {
    serve(acme("member", limit({ percent: 90 })));
    let emit: (event: ChatStreamEvent) => void = () => {};
    mocked.createAssistantChat.mockResolvedValue(chat({ title: null }));
    mocked.getAssistantChat.mockResolvedValue({ chat: chat({ turnRunning: true }), messages: [] });
    mocked.sendAssistantMessage.mockImplementation((_chatId, _text, onEvent) => {
      emit = onEvent;
      return new Promise<boolean>(() => {});
    });
    renderAssistant();
    const panel = await openPanel();
    await userEvent.type(
      await within(panel).findByRole("textbox", { name: "Message the Assistant" }),
      "How many days do I have left?{Enter}"
    );
    await waitFor(() => expect(mocked.sendAssistantMessage).toHaveBeenCalled());

    act(() =>
      emit({
        event: "text",
        id: "sevt_1",
        data: { eventId: "sevt_1", text: "Let me look at your balance." },
      })
    );
    act(() =>
      emit({ event: "error", id: "sevt_2", data: { code: "ASSISTANT_WEEKLY_LIMIT_REACHED" } })
    );

    expect(within(panel).getByText("Let me look at your balance.")).toBeTruthy();
    expect(
      within(panel).getByText("Stopped here: Acme reached this week's Assistant limit.")
    ).toBeTruthy();
  });

  it("should say the Assistant is unavailable when Anthropic refuses, for every organization", async () => {
    serve(acme("member", limit({ percent: 10 })), true);
    renderAssistant();
    const panel = await openPanel();

    expect((await within(panel).findByRole("status")).textContent).toBe(
      "The Assistant is unavailable right now. Try again later."
    );
    expect(within(panel).queryByRole("textbox", { name: "Message the Assistant" })).toBeNull();
  });

  describe("in Czech", () => {
    beforeEach(() => {
      czech = true;
      window.localStorage.setItem("flexiday-locale", "cs");
    });

    it("should show the near-limit bar", async () => {
      serve(acme("member", limit({ percent: 86 })));
      renderAssistant();
      const panel = await openPanel();

      expect((await within(panel).findByTestId("assistant-near-limit")).textContent).toBe(
        "Organizace Acme vyčerpala 86 % Týdenního limitu Asistenta. Obnoví se neděle 15. 11. 16:00."
      );
    });

    it("should show owners the amounts in Czech format", async () => {
      serve(
        acme("owner", limit({ percent: 86, usedMicroUsd: 8_600_000, limitMicroUsd: 10_000_000 }))
      );
      renderAssistant();
      const panel = await openPanel();

      expect((await within(panel).findByTestId("assistant-near-limit")).textContent).toBe(
        "Organizace Acme tento týden využila 8,60 $ z Týdenního limitu Asistenta 10 $ (86 %). Obnoví se neděle 15. 11. 16:00."
      );
    });

    it("should show the paused notice with See usage for owners", async () => {
      serve(acme("owner", limit({ percent: 100, reached: true })));
      renderAssistant();
      const panel = await openPanel();

      expect((await within(panel).findByRole("status")).textContent).toContain(
        "Asistent je pozastavený do neděle 15. 11. 16:00. Organizace Acme vyčerpala Týdenní limit. Chaty si můžeš dál číst a žádosti, které už vidíš, můžeš odeslat."
      );
      expect(within(panel).getByRole("link", { name: "Zobrazit využití" })).toBeTruthy();
    });

    it("should end an answer stopped mid-way with the Czech limit line", async () => {
      serve(acme("member", limit({ percent: 100, reached: true })));
      mocked.getAssistantChat.mockResolvedValue(stopped);
      renderAssistant();
      const panel = await openPanel();
      await openPastChat(panel);

      expect(
        await within(panel).findByText(
          "Odpověď skončila tady: organizace Acme vyčerpala Týdenní limit Asistenta."
        )
      ).toBeTruthy();
    });

    it("should say the Assistant is unavailable", async () => {
      serve(acme("member", limit({ percent: 10 })), true);
      renderAssistant();
      const panel = await openPanel();

      expect((await within(panel).findByRole("status")).textContent).toBe(
        "Asistent teď není k dispozici. Zkus to později."
      );
    });
  });
});
