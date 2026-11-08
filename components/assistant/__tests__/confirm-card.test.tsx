import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import type { CardPreview, PendingCard } from "@/lib/api/assistant";
import * as api from "@/lib/api/assistant";
import { ConfirmCard } from "../confirm-card";

vi.mock("@/lib/api/assistant", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/assistant")>();
  return { ...actual, decideAssistantCard: vi.fn() };
});

const mocked = vi.mocked(api);

const CREATE: CardPreview = {
  action: "create_request",
  group: { id: "g1", name: "Acme Team" },
  type: "VACATION",
  firstDay: "2027-06-07",
  lastDay: "2027-06-08",
  halfDay: false,
  bookedDays: ["2027-06-07", "2027-06-08"],
  days: 2,
  note: "Family trip, back on Wednesday",
  allowances: [
    {
      year: 2027,
      type: "VACATION",
      allocated: 20,
      approved: 4,
      pending: 1.5,
      availableBefore: 14.5,
      availableAfter: 12.5,
    },
  ],
};

const CANCEL: CardPreview = {
  action: "cancel_my_request",
  requestId: "r1",
  group: { id: "g1", name: "Acme Team" },
  type: "HOME_OFFICE",
  status: "approved",
  firstDay: "2027-06-10",
  lastDay: "2027-06-10",
  cancelledDays: ["2027-06-10"],
  days: 1,
  note: "Plumber visit",
  reason: "Plumber moved to Friday",
  allowances: [],
};

const CLOCK_IN: CardPreview = {
  action: "clock_in",
  at: "2026-11-09T07:52:00.000Z",
  businessDate: "2026-11-09",
  timezone: "Europe/Prague",
};

const CLOCK_OUT: CardPreview = {
  action: "clock_out",
  at: "2026-11-09T16:05:00.000Z",
  startedAt: "2026-11-09T07:52:00.000Z",
  businessDate: "2026-11-09",
  timezone: "Europe/Prague",
  onBreak: true,
  sessionMinutes: 493,
};

const card = (preview: CardPreview, overrides: Partial<PendingCard> = {}): PendingCard => ({
  id: `card-${preview.action}`,
  chatId: "chat-1",
  toolUseId: `sevt_${preview.action}`,
  tool: preview.action,
  status: "open",
  preview,
  authorNames: [],
  result: null,
  error: null,
  createdAt: "2026-11-09T08:00:00.000Z",
  decidedAt: null,
  ...overrides,
});

let czech = false;

const show = (value: PendingCard, onDecided = vi.fn()) => {
  const ui = <ConfirmCard card={value} onDecided={onDecided} />;
  renderWithClient(czech ? <I18nProvider>{ui}</I18nProvider> : ui);
  return onDecided;
};

const theCard = () => screen.getByTestId("assistant-card");

beforeEach(() => {
  window.localStorage.removeItem("flexiday-locale");
  mocked.decideAssistantCard.mockReset();
});

afterEach(() => {
  window.localStorage.removeItem("flexiday-locale");
});

describe("ConfirmCard in English", () => {
  beforeEach(() => {
    czech = false;
  });

  it("shows a create card from its preview, the note word for word, and changes nothing until confirmed", async () => {
    const decided = card(CREATE, {
      status: "confirmed",
      result: { requestId: "r9", status: "pending" },
    });
    mocked.decideAssistantCard.mockResolvedValue({ card: decided, turnRunning: true });
    const onDecided = show(card(CREATE));

    const open = theCard();
    expect(open).toHaveAttribute("data-status", "open");
    expect(within(open).getByText("Send this request?")).toBeInTheDocument();
    expect(within(open).getByText("Vacation")).toBeInTheDocument();
    expect(within(open).getByText("Mon 7 Jun – Tue 8 Jun")).toBeInTheDocument();
    expect(within(open).getByText("Working days").nextSibling).toHaveTextContent("2");
    expect(within(open).getByText("Balance").nextSibling).toHaveTextContent("14.5 → 12.5");
    expect(within(open).getByText("Acme Team")).toBeInTheDocument();
    expect(within(open).getByText("Your note, word for word")).toBeInTheDocument();
    expect(within(open).getByText("“Family trip, back on Wednesday”")).toBeInTheDocument();
    expect(within(open).getByText("Marked as made through the Assistant")).toBeInTheDocument();
    expect(within(open).queryByRole("note")).not.toBeInTheDocument();
    expect(mocked.decideAssistantCard).not.toHaveBeenCalled();

    await userEvent.click(within(open).getByRole("button", { name: "Send request" }));
    expect(mocked.decideAssistantCard).toHaveBeenCalledWith("card-create_request", "confirm");
    expect(onDecided).toHaveBeenCalledWith({ card: decided, turnRunning: true });

    const settled = await screen.findByText("Request sent for approval", { exact: false });
    expect(theCard()).toHaveAttribute("data-status", "confirmed");
    expect(settled).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute("href", "/requests");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers Keep it on a cancel card and shows the request's note and the reason", async () => {
    mocked.decideAssistantCard.mockResolvedValue({
      card: card(CANCEL, { status: "declined" }),
      turnRunning: false,
    });
    show(card(CANCEL));

    const open = theCard();
    expect(within(open).getByText("Cancel this request?")).toBeInTheDocument();
    expect(within(open).getByText("Approved")).toBeInTheDocument();
    expect(within(open).getByText("Your note on this request")).toBeInTheDocument();
    expect(within(open).getByText("“Plumber visit”")).toBeInTheDocument();
    expect(within(open).getByText("“Plumber moved to Friday”")).toBeInTheDocument();
    expect(within(open).getByRole("button", { name: "Cancel request" })).toBeInTheDocument();

    await userEvent.click(within(open).getByRole("button", { name: "Keep it" }));
    expect(mocked.decideAssistantCard).toHaveBeenCalledWith("card-cancel_my_request", "decline");
    await screen.findByText("Not done. Nothing changed.", { exact: false });
    expect(theCard()).toHaveAttribute("data-status", "declined");
    expect(screen.queryByRole("link", { name: "Open" })).not.toBeInTheDocument();
  });

  it("shows clock cards in the attendance time zone", () => {
    show(card(CLOCK_IN));
    expect(screen.getByText("Clock in now?")).toBeInTheDocument();
    expect(screen.getByText("Time").nextSibling).toHaveTextContent("08:52");
    expect(screen.getByRole("button", { name: "Not now" })).toBeInTheDocument();
  });

  it("says a break ends with a clock-out", () => {
    show(card(CLOCK_OUT));
    expect(screen.getByText("Clock out now?")).toBeInTheDocument();
    expect(screen.getByText("Worked so far").nextSibling).toHaveTextContent("8 h 13 m");
    expect(screen.getByText("Your break ends too.")).toBeInTheDocument();
  });

  it("shows a refused write in red with Try again, still open", async () => {
    mocked.decideAssistantCard.mockResolvedValue({
      card: card(CREATE, {
        error: { message: "You don't have enough vacation days left", code: null },
      }),
      turnRunning: false,
    });
    show(card(CREATE));

    await userEvent.click(screen.getByRole("button", { name: "Send request" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You don't have enough vacation days left"
    );
    expect(theCard()).toHaveAttribute("data-status", "failed");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Not now" })).toBeInTheDocument();
  });

  it("shows a failed request to decide as an error, keeping the card", async () => {
    mocked.decideAssistantCard.mockRejectedValue(new Error("network"));
    show(card(CLOCK_IN));
    await userEvent.click(screen.getByRole("button", { name: "Clock in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That didn't go through. Try again."
    );
  });

  it("shows a confirmed clock-in with its time and Open", () => {
    show(
      card(CLOCK_IN, {
        status: "confirmed",
        result: { startedAt: "2026-11-09T07:53:00.000Z" },
      })
    );
    expect(theCard()).toHaveTextContent("Clocked in at 08:53");
    expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute("href", "/my-attendance");
  });

  it("shows a card the user moved on from as not taken", () => {
    show(card(CREATE, { status: "not_taken" }));
    expect(theCard()).toHaveAttribute("data-status", "not_taken");
    expect(theCard()).toHaveTextContent("Not taken. Nothing changed.");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("warns when the Assistant read someone else's note before suggesting it", () => {
    show(card(CREATE, { authorNames: ["Olga Owner", "Petr Admin"] }));
    expect(screen.getByRole("note")).toHaveTextContent(
      "Before suggesting this, the Assistant read a note written by Olga Owner and Petr Admin. Check that this is what you asked for."
    );
  });
});

describe("ConfirmCard in Czech", () => {
  beforeEach(() => {
    czech = true;
    window.localStorage.setItem("flexiday-locale", "cs");
  });

  it("shows an open create card with the marker", async () => {
    show(card(CREATE, { authorNames: ["Olga Owner"] }));
    expect(await screen.findByText("Odeslat tuto žádost?")).toBeInTheDocument();
    expect(screen.getByText("Dovolená")).toBeInTheDocument();
    expect(screen.getByText("Zůstatek").nextSibling).toHaveTextContent("14,5 → 12,5");
    expect(screen.getByText("Tvoje poznámka, doslovně")).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent(
      "Než Asistent tohle navrhl, četl poznámku, kterou napsal(a) Olga Owner."
    );
    expect(screen.getByRole("button", { name: "Odeslat žádost" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Teď ne" })).toBeInTheDocument();
    expect(screen.getByText("Označeno jako provedené přes Asistenta")).toBeInTheDocument();
  });

  it("offers Ponechat on a cancel card", async () => {
    show(card(CANCEL));
    expect(await screen.findByText("Zrušit tuto žádost?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ponechat" })).toBeInTheDocument();
    expect(screen.getByText("Schváleno")).toBeInTheDocument();
  });

  it("shows a refused write with Zkusit znovu", async () => {
    mocked.decideAssistantCard.mockResolvedValue({
      card: card(CLOCK_IN, { error: { message: "Už máš záznam příchodu", code: null } }),
      turnRunning: false,
    });
    show(card(CLOCK_IN));
    await userEvent.click(await screen.findByRole("button", { name: "Zaznamenat příchod" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Už máš záznam příchodu");
    expect(screen.getByRole("button", { name: "Zkusit znovu" })).toBeInTheDocument();
  });

  it("shows confirmed, declined and not-taken cards", async () => {
    const { unmount } = renderWithClient(
      <I18nProvider>
        <ConfirmCard card={card(CREATE, { status: "confirmed", result: {} })} />
        <ConfirmCard card={card(CANCEL, { status: "declined" })} />
        <ConfirmCard
          card={card(CLOCK_OUT, {
            status: "not_taken",
          })}
        />
      </I18nProvider>
    );
    expect(await screen.findByText(/Žádost odeslaná ke schválení/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Otevřít" })).toBeInTheDocument();
    expect(screen.getByText(/Neprovedeno\. Nic se nezměnilo\./)).toBeInTheDocument();
    expect(screen.getByText(/Nepoužito\. Nic se nezměnilo\./)).toBeInTheDocument();
    unmount();
  });
});
