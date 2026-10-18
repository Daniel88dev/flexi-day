import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CalendarRecordType } from "@/lib/api/types";
import type { CalendarSyncConfig } from "@/lib/api/calendar-sync";
import { CalCard } from "../cal-card";
import type { ConnectHandlers } from "../connect-section";

const config: CalendarSyncConfig = {
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
    { type: CalendarRecordType.Sick, label: "Sick", color: "coral", mineColor: null },
  ],
  feedUrl: "https://api.flexiday.app/calendars/flx_live_0•••••.ics",
  tokenMasked: true,
  lastFetchedAt: null,
  target: null,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
};

const connect: ConnectHandlers = {
  providers: { google: true, microsoft: true },
  connectDisabled: false,
  onConnect: vi.fn(),
  onSyncNow: vi.fn(),
  onDisconnect: vi.fn(),
  onTimeZoneChange: vi.fn(),
};

function renderCard(c: CalendarSyncConfig) {
  return render(
    <CalCard
      config={c}
      teamsLabel="—"
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onRegen={vi.fn()}
      resolveFeedUrl={vi.fn()}
      connect={connect}
    />
  );
}

describe("CalCard", () => {
  it("shows a Birthdays badge when the feed carries birthdays", () => {
    renderCard({ ...config, types: [], includeBirthdays: true, birthdaysColor: "rose" });
    expect(screen.getByText("Birthdays")).toBeInTheDocument();
  });

  it("shows no Birthdays badge while the row is off", () => {
    renderCard(config);
    expect(screen.queryByText("Birthdays")).not.toBeInTheDocument();
  });

  it("renders the name, scope, masked url and type badges", () => {
    renderCard(config);
    expect(screen.getByText("My time off")).toBeInTheDocument();
    expect(screen.getByText("My records")).toBeInTheDocument();
    expect(screen.getByText(config.feedUrl)).toBeInTheDocument();
    expect(screen.getByText("Vacation")).toBeInTheDocument();
    expect(screen.getByText("Sick")).toBeInTheDocument();
  });

  it("ends with the connect buttons when the calendar has no target", () => {
    renderCard(config);
    expect(screen.getByText("Direct sync")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connect Google" })).toBeInTheDocument();
  });

  it("ends with the connection status when the calendar has a target", () => {
    renderCard({
      ...config,
      target: {
        provider: "GOOGLE",
        status: "ACTIVE",
        capability: "STATUS",
        timeZone: "Europe/Prague",
        lastSyncedAt: new Date().toISOString(),
        lastError: null,
        syncing: false,
      },
    });
    expect(screen.getByText("Synced")).toBeInTheDocument();
    expect(screen.getByText("Primary calendar")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Connect Google" })).not.toBeInTheDocument();
  });
});
