import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VacationKind } from "@/lib/api/types";
import type { CalendarSyncConfig } from "@/lib/api/calendar-sync";
import { CalCard } from "../cal-card";

const config: CalendarSyncConfig = {
  id: "cfg-1",
  name: "My time off",
  scope: "ME",
  distinguishMine: false,
  teamIds: [],
  types: [
    { type: VacationKind.Vacation, label: "Vacation", color: "violet", mineColor: null },
    { type: VacationKind.Sick, label: "Sick", color: "coral", mineColor: null },
  ],
  feedUrl: "https://api.flexiday.app/calendars/flx_live_0•••••.ics",
  tokenMasked: true,
  lastFetchedAt: null,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
};

describe("CalCard", () => {
  it("renders the name, scope, masked url and type badges", () => {
    render(
      <CalCard
        config={config}
        teamsLabel="—"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onRegen={vi.fn()}
        resolveFeedUrl={vi.fn()}
      />
    );
    expect(screen.getByText("My time off")).toBeInTheDocument();
    expect(screen.getByText("My records")).toBeInTheDocument();
    expect(screen.getByText(config.feedUrl)).toBeInTheDocument();
    expect(screen.getByText("Vacation")).toBeInTheDocument();
    expect(screen.getByText("Sick")).toBeInTheDocument();
  });
});
