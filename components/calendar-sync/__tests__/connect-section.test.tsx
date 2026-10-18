import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CalendarRecordType } from "@/lib/api/types";
import type { CalendarSyncConfig, CalendarTarget } from "@/lib/api/calendar-sync";
import { ConnectSection, type ConnectHandlers } from "../connect-section";

const NOW = new Date("2026-10-11T12:00:00.000Z");
const FIVE_MIN_AGO = "2026-10-11T11:55:00.000Z";

function meConfig(target: Partial<CalendarTarget> | null = {}): CalendarSyncConfig {
  return {
    id: "cfg-1",
    name: "My time off",
    scope: "ME",
    distinguishMine: false,
    timeZone: "Europe/Prague",
    includeBirthdays: false,
    birthdaysColor: null,
    teamIds: [],
    types: [
      { type: CalendarRecordType.Vacation, label: "Vacation", color: "violet", mineColor: null },
    ],
    feedUrl: "https://api.example.test/feed.ics",
    tokenMasked: true,
    lastFetchedAt: null,
    target:
      target === null
        ? null
        : {
            provider: "GOOGLE",
            status: "ACTIVE",
            capability: "STATUS",
            timeZone: "Europe/Prague",
            lastSyncedAt: FIVE_MIN_AGO,
            lastError: null,
            syncing: false,
            ...target,
          },
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  };
}

function handlers(over: Partial<ConnectHandlers> = {}): ConnectHandlers {
  return {
    providers: { google: true, microsoft: true },
    connectDisabled: false,
    onConnect: vi.fn(),
    onSyncNow: vi.fn(),
    onDisconnect: vi.fn(),
    onTimeZoneChange: vi.fn().mockResolvedValue(undefined),
    ...over,
  };
}

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Sync actions" }));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ConnectSection", () => {
  describe("not connected", () => {
    it("names both providers, offers a button for each and explains the primary calendar", () => {
      const h = handlers();
      const config = meConfig(null);
      render(<ConnectSection config={config} {...h} />);

      expect(screen.getByText("Direct sync")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Push your approved days off into your own Google or Microsoft calendar. Only your records are synced; teammates never are."
        )
      ).toBeInTheDocument();
      expect(screen.getByText(/Events go to your primary calendar\./)).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Connect Google" }));
      expect(h.onConnect).toHaveBeenCalledWith(config, "google");
      fireEvent.click(screen.getByRole("button", { name: "Connect Microsoft" }));
      expect(h.onConnect).toHaveBeenCalledWith(config, "microsoft");
    });

    it("hides Microsoft and names Google alone while Microsoft is switched off", () => {
      render(
        <ConnectSection
          config={meConfig(null)}
          {...handlers({ providers: { google: true, microsoft: false } })}
        />
      );

      expect(
        screen.getByText(/into your own Google calendar\. Only your records/)
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Connect Google" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Connect Microsoft" })).not.toBeInTheDocument();
    });

    it("renders nothing while every provider is switched off", () => {
      const { container } = render(
        <ConnectSection
          config={meConfig(null)}
          {...handlers({ providers: { google: false, microsoft: false } })}
        />
      );
      expect(container).toBeEmptyDOMElement();
    });

    it("keeps the buttons disabled while a connection is starting", () => {
      render(<ConnectSection config={meConfig(null)} {...handlers({ connectDisabled: true })} />);
      expect(screen.getByRole("button", { name: "Connect Google" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Connect Microsoft" })).toBeDisabled();
    });
  });

  it("gives a TEAM card the one-sentence note and nothing to press", () => {
    render(<ConnectSection config={{ ...meConfig(null), scope: "TEAM" }} {...handlers()} />);

    expect(screen.getByText(/Team calendars cannot connect to a provider\./)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows Syncing… and the neutral note before the first sync", () => {
    render(
      <ConnectSection
        config={meConfig({ capability: "UNKNOWN", lastSyncedAt: null, syncing: true })}
        {...handlers()}
      />
    );

    expect(screen.getByText("Google")).toBeInTheDocument();
    expect(screen.getByText("Syncing…")).toBeInTheDocument();
    expect(screen.getByText("Primary calendar")).toBeInTheDocument();
    expect(screen.queryByText(/Last synced/)).not.toBeInTheDocument();
    expect(screen.getByText("Checking what your account supports…")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Time zone" })).toHaveValue("Europe/Prague");
  });

  it("shows Synced, the meta row and the Workspace note for a Google account with status events", () => {
    const h = handlers();
    const config = meConfig();
    render(<ConnectSection config={config} {...h} />);

    expect(screen.getByText("Synced")).toBeInTheDocument();
    expect(screen.getByText("Last synced 5 min ago")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Full days show as a location chip with the absence type. Timed absences show as Out of office. Home office sets your working location to Home."
      )
    ).toBeInTheDocument();

    openMenu();
    fireEvent.click(screen.getByRole("button", { name: "Sync now" }));
    expect(h.onSyncNow).toHaveBeenCalledWith(config);

    openMenu();
    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    expect(h.onDisconnect).toHaveBeenCalledWith(config);
  });

  it("shows the Busy-event note for a plain Google account", () => {
    render(<ConnectSection config={meConfig({ capability: "PLAIN" })} {...handlers()} />);
    expect(
      screen.getByText(/Your Google account shows absences as Busy events\./)
    ).toBeInTheDocument();
  });

  it("shows the Microsoft note for a Microsoft account", () => {
    render(
      <ConnectSection
        config={meConfig({ provider: "MICROSOFT", capability: "UNKNOWN" })}
        {...handlers()}
      />
    );
    expect(screen.getByText("Microsoft")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Absences show as Out of office. Home office is not synced to Microsoft calendars."
      )
    ).toBeInTheDocument();
  });

  it("asks to reconnect a broken connection and keeps only Disconnect in the menu", () => {
    const h = handlers();
    const config = meConfig({
      provider: "MICROSOFT",
      status: "NEEDS_RECONNECT",
      lastError: "auth_revoked",
    });
    render(<ConnectSection config={config} {...h} />);

    expect(screen.getByText("Needs reconnecting")).toBeInTheDocument();
    expect(screen.getByText(/Your calendar connection has expired\./)).toBeInTheDocument();
    expect(screen.getByText("Last synced 5 min ago")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reconnect" }));
    expect(h.onConnect).toHaveBeenCalledWith(config, "microsoft");

    openMenu();
    expect(screen.queryByRole("button", { name: "Sync now" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Disconnect" })).toBeInTheDocument();
  });

  it("treats an auth_revoked error on an active target as needing a reconnect", () => {
    render(<ConnectSection config={meConfig({ lastError: "auth_revoked" })} {...handlers()} />);
    expect(screen.getByText("Needs reconnecting")).toBeInTheDocument();
  });

  it("explains the plan pause and offers no Sync now", () => {
    render(
      <ConnectSection config={meConfig({ status: "PAUSED", lastError: "plan" })} {...handlers()} />
    );

    expect(screen.getByText("Paused")).toBeInTheDocument();
    expect(screen.getByText(/Direct sync needs a paid plan\./)).toBeInTheDocument();
    openMenu();
    expect(screen.queryByRole("button", { name: "Sync now" })).not.toBeInTheDocument();
  });

  it("shows the error line, not a spinner, when retries ended with an error", () => {
    render(
      <ConnectSection config={meConfig({ lastError: "http_500", syncing: true })} {...handlers()} />
    );

    expect(screen.getByText("Sync failed")).toBeInTheDocument();
    expect(screen.getByText(/The last sync did not go through\./)).toBeInTheDocument();
    expect(screen.queryByText("Syncing…")).not.toBeInTheDocument();
  });

  it("treats a throttled run that gave up like any failed sync", () => {
    render(
      <ConnectSection
        config={meConfig({ lastError: "throttled", syncing: true })}
        {...handlers()}
      />
    );
    expect(screen.getByText("Sync failed")).toBeInTheDocument();
    expect(screen.queryByText("Syncing…")).not.toBeInTheDocument();
  });

  it("saves a new time zone", () => {
    const h = handlers();
    const config = meConfig();
    render(<ConnectSection config={config} {...h} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Time zone" }), {
      target: { value: "Europe/London" },
    });
    expect(h.onTimeZoneChange).toHaveBeenCalledWith(config, "Europe/London");
    expect(screen.getByRole("combobox", { name: "Time zone" })).toHaveValue("Europe/London");
  });
});
