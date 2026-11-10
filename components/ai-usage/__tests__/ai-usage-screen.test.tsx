import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import type { AiUsage, AiUsageDay, AiUsageWeekDetail } from "@/lib/api/ai-usage";
import * as usageApi from "@/lib/api/ai-usage";
import { AiUsageScreen } from "../ai-usage-screen";

const state = { phone: false, organizationId: null as string | null };
const pushToast = vi.fn();

vi.mock("@/lib/api/ai-usage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/ai-usage")>();
  return {
    ...actual,
    getAiUsage: vi.fn(),
    getAiUsageWeek: vi.fn(),
    revokeAiConnection: vi.fn(),
  };
});
vi.mock("@/lib/api/queries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/queries")>();
  return {
    ...actual,
    useOrganizations: () => ({
      data: [{ id: "org-acme", name: "Acme", isOwner: true }],
      isLoading: false,
      error: null,
    }),
  };
});
vi.mock("next/navigation", () => ({
  useSearchParams: () =>
    new URLSearchParams(state.organizationId ? `organizationId=${state.organizationId}` : ""),
}));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => state.phone }));
vi.mock("@/components/toast", () => ({
  pushToast: (...args: unknown[]) => pushToast(...args),
}));

const mocked = vi.mocked(usageApi);

const days = (reachedOn: string | null): AiUsageDay[] =>
  Array.from({ length: 14 }, (_, index) => {
    const day = new Date(Date.UTC(2026, 9, 27 + index)).toISOString().slice(0, 10);
    return {
      day,
      calls: day === reachedOn ? 20_000 : index === 13 ? 2364 : 400 + index,
      limitReachedAt: day === reachedOn ? `${day}T15:06:00Z` : null,
    };
  });

const app = (
  grantId: string,
  name: string,
  host: string,
  options: { verified?: boolean; access?: "read" | "write" } = {}
) => ({
  grantId,
  app: { clientId: `https://${host}/meta`, name, verified: options.verified ?? true, host },
  access: options.access ?? "read",
  connectedAt: "2026-10-28T09:00:00Z",
  lastUsedAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
});

const usage = (overrides: Partial<AiUsage> = {}): AiUsage => ({
  organizationId: "org-acme",
  organizationName: "Acme",
  assistant: {
    on: true,
    weekStart: "2026-11-09",
    usedMicroUsd: 6_420_000,
    limitMicroUsd: 10_000_000,
    resetsAt: "2026-11-16T00:00:00Z",
    reached: false,
    limitReachedAt: null,
    weeks: [
      { weekStart: "2026-11-02", usedMicroUsd: 8_910_000, limitReachedAt: null, perPerson: true },
      {
        weekStart: "2026-10-26",
        usedMicroUsd: 10_000_000,
        limitReachedAt: "2026-10-30T22:06:00Z",
        perPerson: true,
      },
      { weekStart: "2026-04-13", usedMicroUsd: 1_120_000, limitReachedAt: null, perPerson: false },
    ],
  },
  aiConnections: {
    on: true,
    dailyLimit: 20_000,
    memberDailyLimit: 1000,
    callsToday: 2364,
    resetsAt: "2026-11-10T00:00:00Z",
    days: days("2026-11-04"),
  },
  people: [
    {
      userId: "u-jana",
      name: "Jana Nováková",
      assistantMicroUsd: 2_180_000,
      refusedTurns: 0,
      callsToday: 212,
      apps: [app("grant-claude", "Claude", "claude.ai")],
    },
    {
      userId: "u-petr",
      name: "Petr Svoboda",
      assistantMicroUsd: 1_640_000,
      refusedTurns: 1,
      callsToday: 940,
      apps: [
        app("grant-chatgpt", "ChatGPT", "chatgpt.com", { access: "write" }),
        app("grant-cursor", "Cursor", "localhost", { verified: false }),
      ],
    },
    {
      userId: "u-tomas",
      name: "Tomáš Černý",
      assistantMicroUsd: 710_000,
      refusedTurns: 4,
      callsToday: 1000,
      apps: [],
    },
    {
      userId: null,
      name: null,
      assistantMicroUsd: 390_000,
      refusedTurns: 0,
      callsToday: 0,
      apps: [],
    },
  ],
  ...overrides,
});

const lastWeek: AiUsageWeekDetail = {
  weekStart: "2026-11-02",
  usedMicroUsd: 8_910_000,
  people: [
    { userId: "u-jana", name: "Jana Nováková", assistantMicroUsd: 5_000_000, refusedTurns: 0 },
    { userId: "u-tomas", name: "Tomáš Černý", assistantMicroUsd: 3_520_000, refusedTurns: 3 },
    { userId: null, name: null, assistantMicroUsd: 390_000, refusedTurns: 0 },
  ],
};

let czech = false;
const renderScreen = () =>
  renderWithClient(czech ? <I18nProvider>{<AiUsageScreen />}</I18nProvider> : <AiUsageScreen />);

const card = (title: string) =>
  screen.getByRole("heading", { name: title }).closest<HTMLElement>("[data-slot='card']")!;

describe("AiUsageScreen", () => {
  beforeEach(() => {
    czech = false;
    state.phone = false;
    state.organizationId = null;
    window.localStorage.clear();
    mocked.getAiUsage.mockReset();
    mocked.getAiUsageWeek.mockReset();
    mocked.revokeAiConnection.mockReset();
    mocked.getAiUsage.mockResolvedValue(usage());
    mocked.getAiUsageWeek.mockResolvedValue(lastWeek);
    mocked.revokeAiConnection.mockResolvedValue(undefined);
    pushToast.mockReset();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  describe("in English", () => {
    it("should show this week's Assistant usage against the Weekly limit, with past-week bars", async () => {
      renderScreen();

      expect(
        await screen.findByRole("heading", { name: "AI usage", level: 1 })
      ).toBeInTheDocument();
      expect(
        screen.getByText("Acme · the Assistant and members' connected AI apps")
      ).toBeInTheDocument();
      const assistant = card("Assistant this week");
      expect(within(assistant).getByTestId("ai-usage-used")).toHaveTextContent("$6.42");
      expect(within(assistant).getByText("of $10 Weekly limit · 64%")).toBeInTheDocument();
      expect(
        within(assistant).getByText(
          "Resets Sunday 15 Nov, 16:00. Includes answers being written right now."
        )
      ).toBeInTheDocument();
      expect(within(assistant).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "64");
      const bars = within(within(assistant).getByRole("list", { name: "Assistant usage per week" }))
        .getAllByRole("listitem")
        .map((bar) => bar.getAttribute("aria-label")?.replace(/\s/g, " "));
      expect(bars).toHaveLength(9);
      expect(bars).toContain("26 Oct – 1 Nov: $10, limit reached");
      expect(bars).toContain("2 – 8 Nov: $8.91");
      expect(bars.at(-1)).toBe("This week: $6.42");
      expect(mocked.getAiUsage).toHaveBeenCalledWith("org-acme");
    });

    it("should say when the Weekly limit was reached and that everyone is paused", async () => {
      mocked.getAiUsage.mockResolvedValue(
        usage({
          assistant: {
            ...usage().assistant,
            usedMicroUsd: 10_000_000,
            reached: true,
            limitReachedAt: "2026-11-12T16:14:00Z",
          },
        })
      );
      renderScreen();

      const assistant = await screen.findByText("Weekly limit reached");
      expect(assistant.parentElement).toHaveTextContent(
        "Weekly limit reached on Thu 12 Nov, 08:14. The Assistant is paused for everyone until Sunday 15 Nov, 16:00."
      );
      expect(screen.getByText("of $10 Weekly limit · 100%")).toBeInTheDocument();
    });

    it("should count today's AI connection calls and mark the limit-reached day", async () => {
      renderScreen();

      const connections = await screen.findByRole("heading", { name: "AI connections today" });
      const section = connections.closest<HTMLElement>("[data-slot='card']")!;
      expect(within(section).getByTestId("ai-usage-calls-today")).toHaveTextContent("2,364");
      expect(
        within(section).getByText(
          "of 20,000 calls today, the daily AI connection limit · resets at 16:00"
        )
      ).toBeInTheDocument();
      const bars = within(
        within(section).getByRole("list", { name: "Calls per day, last 14 days" })
      )
        .getAllByRole("listitem")
        .map((bar) => bar.getAttribute("aria-label"));
      expect(bars).toHaveLength(14);
      expect(bars).toContain("4 Nov: limit reached");
      expect(bars.at(-1)).toBe("Today: 2,364 calls");
      expect(
        within(section).getByText("4 Nov: limit reached", { selector: "span" })
      ).toBeInTheDocument();
    });

    it("should list each person with spend, refused turns, calls today and apps, and Deleted account", async () => {
      renderScreen();

      const table = await screen.findByTestId("ai-usage-people-table");
      const rows = within(table).getAllByRole("row").slice(1);
      expect(rows.map((row) => row.textContent)).toEqual([
        "Jana Nováková$2.180212Claude",
        "Petr Svoboda$1.641940ChatGPT, Cursor",
        "Tomáš Černý$0.7141,000 · limitNone",
        "Deleted account$0.3900None",
      ]);
      expect(within(rows[2]!).getByText("4")).toHaveAttribute("data-warning", "true");
      expect(within(rows[1]!).getByText("1")).not.toHaveAttribute("data-warning");
      expect(within(rows[2]!).getByText("1,000 · limit")).toHaveAttribute("data-warning", "true");
      expect(within(rows[3]!).getByText("Deleted account")).toHaveClass("italic");
      expect(within(rows[3]!).queryByRole("button")).toBeNull();
    });

    it("should open a person's apps and revoke one after the inline confirm", async () => {
      renderScreen();

      await userEvent.click(
        await screen.findByRole("button", { name: "Show the apps of Petr Svoboda" })
      );
      const apps = screen.getByRole("list", { name: "Connected apps" });
      expect(within(apps).getByText("ChatGPT")).toBeInTheDocument();
      expect(within(apps).getByText("Read and write")).toBeInTheDocument();
      expect(within(apps).getByText("localhost · name not verified")).toBeInTheDocument();

      await userEvent.click(within(apps).getByRole("button", { name: "Revoke ChatGPT" }));
      expect(within(apps).getByText("Stops at its next call")).toBeInTheDocument();
      expect(mocked.revokeAiConnection).not.toHaveBeenCalled();
      await userEvent.click(within(apps).getByRole("button", { name: "Revoke" }));

      await waitFor(() =>
        expect(mocked.revokeAiConnection).toHaveBeenCalledWith("org-acme", "grant-chatgpt")
      );
      expect(pushToast).toHaveBeenCalledWith("ChatGPT is revoked");
      await waitFor(() => expect(mocked.getAiUsage).toHaveBeenCalledTimes(2));
    });

    it("should keep the app when Keep is pressed", async () => {
      renderScreen();

      await userEvent.click(
        await screen.findByRole("button", { name: "Show the apps of Jana Nováková" })
      );
      const apps = screen.getByRole("list", { name: "Connected apps" });
      await userEvent.click(within(apps).getByRole("button", { name: "Revoke Claude" }));
      await userEvent.click(within(apps).getByRole("button", { name: "Keep" }));

      expect(within(apps).queryByText("Stops at its next call")).toBeNull();
      expect(mocked.revokeAiConnection).not.toHaveBeenCalled();
    });

    it("should open a past week to its per-person split, and say an old week keeps only the total", async () => {
      renderScreen();

      const weeks = await screen.findByRole("list", { name: "Past weeks" });
      expect(within(weeks).getByText("Limit reached Fri 30 Oct, 15:06")).toBeInTheDocument();
      await userEvent.click(within(weeks).getByRole("button", { name: /2\s–\s8 Nov/ }));

      expect(mocked.getAiUsageWeek).toHaveBeenCalledWith("org-acme", "2026-11-02");
      const split = await within(weeks).findByRole("table");
      expect(
        within(split)
          .getAllByRole("row")
          .slice(1)
          .map((row) => row.textContent)
      ).toEqual(["Jana Nováková$50", "Tomáš Černý$3.523", "Deleted account$0.390"]);

      await userEvent.click(within(weeks).getByRole("button", { name: /13\s–\s19 Apr/ }));
      expect(
        within(weeks).getByText(
          "This week is more than 180 days old, so only the organization total is kept."
        )
      ).toBeInTheDocument();
      expect(mocked.getAiUsageWeek).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Per-person usage is kept for 180 days.")).toBeInTheDocument();
    });

    it("should show the empty state with both features off, linking to the organization settings", async () => {
      mocked.getAiUsage.mockResolvedValue(
        usage({
          assistant: { ...usage().assistant, on: false },
          aiConnections: { ...usage().aiConnections, on: false },
        })
      );
      renderScreen();

      expect(
        await screen.findByText(
          "The Assistant and AI connections are both off in Acme, so there is nothing to show."
        )
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Open organization settings" })).toHaveAttribute(
        "href",
        "/organization?organizationId=org-acme"
      );
      expect(screen.queryByRole("heading", { name: "People" })).toBeNull();
    });

    it("should show the no-usage-yet state", async () => {
      mocked.getAiUsage.mockResolvedValue(
        usage({
          assistant: { ...usage().assistant, usedMicroUsd: 0, weeks: [] },
          aiConnections: {
            ...usage().aiConnections,
            callsToday: 0,
            days: days(null).map((day) => ({ ...day, calls: 0 })),
          },
          people: [],
        })
      );
      renderScreen();

      expect(
        await screen.findByText("No one has used the Assistant or connected an AI app yet.")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Past weeks appear here after the first Monday.")
      ).toBeInTheDocument();
      expect(screen.getByTestId("ai-usage-used")).toHaveTextContent("$0");
      expect(screen.queryByRole("list", { name: "Assistant usage per week" })).toBeNull();
      expect(screen.queryByRole("list", { name: "Calls per day, last 14 days" })).toBeNull();
    });

    it("should say which feature is off when only one is on", async () => {
      mocked.getAiUsage.mockResolvedValue(
        usage({ assistant: { ...usage().assistant, on: false } })
      );
      renderScreen();

      expect(await screen.findByText("The Assistant is off.")).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Past weeks" })).toBeNull();
      const table = screen.getByTestId("ai-usage-people-table");
      expect(within(table).queryByText("Refused")).toBeNull();
    });

    it("should stack the People table as cards on a phone", async () => {
      state.phone = true;
      renderScreen();

      const cards = await screen.findByTestId("ai-usage-people-cards");
      expect(screen.queryByTestId("ai-usage-people-table")).toBeNull();
      const items = within(cards).getAllByRole("listitem");
      expect(items).toHaveLength(4);
      expect(items[2]).toHaveTextContent("Tomáš Černý");
      expect(within(items[2]!).getByText("1,000 · limit")).toBeInTheDocument();
      expect(within(items[3]!).getByText("Deleted account")).toBeInTheDocument();

      await userEvent.click(
        within(items[1]!).getByRole("button", { name: "Show the apps of Petr Svoboda" })
      );
      await userEvent.click(within(items[1]!).getByRole("button", { name: "Revoke Cursor" }));
      await userEvent.click(within(items[1]!).getByRole("button", { name: "Revoke" }));
      await waitFor(() =>
        expect(mocked.revokeAiConnection).toHaveBeenCalledWith("org-acme", "grant-cursor")
      );
    });

    it("should open the organization a link names", async () => {
      state.organizationId = "org-acme";
      renderScreen();
      await screen.findByRole("heading", { name: "People" });
      expect(mocked.getAiUsage).toHaveBeenCalledWith("org-acme");
    });

    it("should say when the usage could not load", async () => {
      mocked.getAiUsage.mockRejectedValue(new Error("boom"));
      renderScreen();
      expect(await screen.findByText("Could not load AI usage.")).toBeInTheDocument();
    });
  });

  describe("in Czech", () => {
    beforeEach(() => {
      czech = true;
      window.localStorage.setItem("flexiday-locale", "cs");
    });

    it("should show every section", async () => {
      renderScreen();

      expect(
        await screen.findByRole("heading", { name: "Využití AI", level: 1 })
      ).toBeInTheDocument();
      const assistant = card("Asistent tento týden");
      expect(within(assistant).getByTestId("ai-usage-used")).toHaveTextContent("6,42 $");
      expect(within(assistant).getByText("z Týdenního limitu 10 $ · 64 %")).toBeInTheDocument();
      expect(
        within(assistant).getByText(/^Obnoví se neděle 15\. 11\. 16:00\. Zahrnuje i odpovědi/)
      ).toBeInTheDocument();
      const connections = card("AI připojení dnes");
      expect(within(connections).getByTestId("ai-usage-calls-today")).toHaveTextContent(/^2\s364$/);
      const table = screen.getByTestId("ai-usage-people-table");
      expect(within(table).getByRole("columnheader", { name: "Odmítnuto" })).toBeInTheDocument();
      expect(within(table).getByText(/1\s000 · limit/)).toBeInTheDocument();
      expect(within(table).getByText("Deleted account")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Předchozí týdny" })).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole("button", { name: "Zobrazit aplikace: Petr Svoboda" })
      );
      await userEvent.click(screen.getByRole("button", { name: "Odvolat ChatGPT" }));
      expect(screen.getByText("Přestane fungovat při dalším volání")).toBeInTheDocument();
    });

    it("should show the empty and no-usage states", async () => {
      mocked.getAiUsage.mockResolvedValue(
        usage({
          assistant: { ...usage().assistant, on: false },
          aiConnections: { ...usage().aiConnections, on: false },
        })
      );
      const { unmount } = renderScreen();
      expect(
        await screen.findByText(
          "Asistent i AI připojení jsou v organizaci Acme vypnuté, takže tu nic není."
        )
      ).toBeInTheDocument();
      unmount();

      mocked.getAiUsage.mockResolvedValue(
        usage({ people: [], assistant: { ...usage().assistant, weeks: [] } })
      );
      renderScreen();
      expect(
        await screen.findByText("Asistenta zatím nikdo nepoužil a nikdo nepřipojil AI aplikaci.")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Předchozí týdny se tu objeví po prvním pondělí.")
      ).toBeInTheDocument();
    });

    it("should stack People as cards on a phone", async () => {
      state.phone = true;
      renderScreen();

      const cards = await screen.findByTestId("ai-usage-people-cards");
      const items = within(cards).getAllByRole("listitem");
      expect(within(items[0]!).getByText("Asistent tento týden")).toBeInTheDocument();
      expect(within(items[0]!).getByText("2,18 $")).toBeInTheDocument();
      expect(within(items[3]!).getByText("Deleted account")).toBeInTheDocument();
    });
  });
});
