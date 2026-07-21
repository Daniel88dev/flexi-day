import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { VacationKind } from "@/lib/api/types";
import { SubscribePanel } from "../subscribe-panel";
import { PreviewPanel } from "../preview-panel";
import type { PreviewEntry } from "@/lib/calendar-sync/preview";
import { swatch } from "@/lib/calendar-sync/meta";

const FEED = "https://api.flexiday.app/calendars/flx_live_0123456789abcdef.ics";

describe("SubscribePanel", () => {
  it("masks the link by default and reveals it on toggle", () => {
    render(<SubscribePanel name="My feed" feedUrl={FEED} onBack={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/is ready/)).toBeInTheDocument();
    expect(screen.queryByText(FEED)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reveal link" }));
    expect(screen.getByText(FEED)).toBeInTheDocument();
  });

  it("lists the three calendar providers", () => {
    render(<SubscribePanel name="My feed" feedUrl={FEED} onBack={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("Google Calendar")).toBeInTheDocument();
    expect(screen.getByText("Outlook / Microsoft 365")).toBeInTheDocument();
    expect(screen.getByText("Apple Calendar")).toBeInTheDocument();
  });
});

describe("PreviewPanel", () => {
  const geometry = { monthLabel: "July 2026", monthDays: 31, firstWeekdayMondayIdx: 2 };

  it("shows an empty hint when there are no entries", () => {
    render(
      <PreviewPanel name="My feed" entries={[]} mode="month" setMode={vi.fn()} geometry={geometry} />
    );
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
  });

  it("renders agenda rows for entries", () => {
    const entries: PreviewEntry[] = [
      {
        id: "p0",
        type: VacationKind.Vacation,
        from: 10,
        to: 12,
        name: "You",
        isMine: true,
        color: swatch("violet"),
        note: "Trip",
      },
    ];
    render(
      <PreviewPanel
        name="My feed"
        entries={entries}
        mode="agenda"
        setMode={vi.fn()}
        geometry={geometry}
      />
    );
    expect(screen.getByText("You — Vacation")).toBeInTheDocument();
    expect(screen.getByText("Trip")).toBeInTheDocument();
  });
});
