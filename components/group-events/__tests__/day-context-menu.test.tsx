import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeaveCalendar, type CalendarRange } from "@/components/dashboard/leave-calendar";
import { StripeCalendar } from "@/components/dashboard/stripe-calendar";
import { mouse, stubViewport } from "@/components/dashboard/__tests__/drag-test-setup";
import type { GroupEventRow } from "@/lib/api/group-events";
import { CalendarRecordType } from "@/lib/api/types";
import { dayItemsByDate, type DayItem } from "@/lib/calendar/day-items";
import type { DayRecord } from "@/lib/calendar/stripes";
import { DEFAULT_LEAVE_TYPES } from "@/lib/demo/leave-meta";
import { groupEventDayItems } from "@/lib/group-events/day-items";
import { en } from "@/lib/i18n/dictionaries/en";
import { DayContextMenu } from "../day-context-menu";

// October 2026 opens on a Thursday: the grid runs 28 September to 8 November.
const VIEWER = "u-me";
const WINDOW = { from: "2026-09-28", to: "2026-11-08" };

const RANGE: CalendarRange = {
  id: "r-1",
  who: "Pat Doe",
  user: { id: "u-pat", name: "Pat Doe", initials: "PD", avatarColor: "#888" },
  type: CalendarRecordType.Vacation,
  from: "2026-10-12",
  to: "2026-10-16",
  vacationIds: ["v-1"],
} as CalendarRange;

const RECORDS: DayRecord[] = ["12", "13", "14", "15", "16"].map((d) => ({
  id: `v-pat-${d}`,
  userId: "u-pat",
  type: CalendarRecordType.Vacation,
  date: `2026-10-${d}`,
  halfDay: false,
  pending: false,
  mirroredFrom: null,
}));

const EVENT: GroupEventRow = {
  id: "ge-1",
  groupId: "g-1",
  groupName: "Dev Team",
  title: "Retro",
  note: null,
  startDate: "2026-10-14",
  endDate: "2026-10-14",
  startTime: "15:00",
  endTime: "16:00",
  repeat: null,
  skippedDates: [],
  recurringEventId: null,
  originalDate: null,
  createdBy: { id: "u-sam", name: "Sam Lee", initials: "SL", avatarColor: "#777" },
  canEdit: true,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

const BIRTHDAY: DayItem = {
  key: "bd:u-pat:2026-10-14",
  kind: "birthday",
  date: "2026-10-14",
  title: "Pat turns 34",
};

function itemsFor(event: GroupEventRow, handlers = { onEdit: vi.fn(), onDelete: vi.fn() }) {
  const items = dayItemsByDate([
    ...groupEventDayItems([event], WINDOW, { viewerId: VIEWER, showGroup: false, t: en, handlers }),
    BIRTHDAY,
  ]);
  return { items, handlers };
}

/** What a browser answers for a point over a bar or stripe: the overlay first, the day cell under it. */
function pointOver(overlay: Element, date: string) {
  const cell = document.querySelector(`[data-date="${date}"]`)!;
  document.elementsFromPoint = vi.fn(() => [overlay, cell]);
  fireEvent.contextMenu(overlay, { clientX: 300, clientY: 200 });
}

function renderLanes(menu: Partial<React.ComponentProps<typeof DayContextMenu>> = {}) {
  const onRangeSelect = vi.fn();
  const onRequestTimeOff = vi.fn();
  const onNewGroupEvent = vi.fn();
  const dayItems = menu.dayItems ?? itemsFor(EVENT).items;
  render(
    <DayContextMenu
      dayItems={dayItems}
      onRequestTimeOff={onRequestTimeOff}
      onNewGroupEvent={onNewGroupEvent}
      {...menu}
    >
      <LeaveCalendar
        year={2026}
        month={10}
        today={null}
        ranges={[RANGE]}
        filter={new Set(DEFAULT_LEAVE_TYPES)}
        onSelect={vi.fn()}
        onDayClick={vi.fn()}
        onRangeSelect={onRangeSelect}
        viewerId={VIEWER}
        dayItems={dayItems}
      />
    </DayContextMenu>
  );
  return { onRangeSelect, onRequestTimeOff, onNewGroupEvent };
}

function renderStripes(menu: Partial<React.ComponentProps<typeof DayContextMenu>> = {}) {
  const onRangeSelect = vi.fn();
  const onRequestTimeOff = vi.fn();
  const onNewGroupEvent = vi.fn();
  const dayItems = menu.dayItems ?? itemsFor(EVENT).items;
  render(
    <DayContextMenu
      dayItems={dayItems}
      onRequestTimeOff={onRequestTimeOff}
      onNewGroupEvent={onNewGroupEvent}
      {...menu}
    >
      <StripeCalendar
        year={2026}
        month={10}
        today={null}
        records={RECORDS}
        holidays={[]}
        filter={new Set(DEFAULT_LEAVE_TYPES)}
        viewerId={VIEWER}
        onOpenRequest={vi.fn()}
        onBook={vi.fn()}
        onRangeSelect={onRangeSelect}
        dayItems={dayItems}
      />
    </DayContextMenu>
  );
  return { onRangeSelect, onRequestTimeOff, onNewGroupEvent };
}

const stripesDay = (label: string) =>
  screen.getByRole("button", { name: new RegExp(`^\\w+,? ${label}(,|$)`) });

describe("DayContextMenu", () => {
  const original = document.elementsFromPoint;
  beforeEach(() => stubViewport({ width: 1280 }));
  afterEach(() => {
    document.elementsFromPoint = original;
    vi.restoreAllMocks();
  });

  it("resolves the day under a Lanes bar and requests time off on it", async () => {
    const user = userEvent.setup();
    const { onRequestTimeOff } = renderLanes();

    pointOver(screen.getByRole("button", { name: /Pat Doe/ }), "2026-10-14");

    const menu = await screen.findByRole("menu");
    expect(within(menu).getByText("Wed 14 Oct")).toBeInTheDocument();
    await user.click(within(menu).getByRole("menuitem", { name: "Request time off" }));
    expect(onRequestTimeOff).toHaveBeenCalledWith("2026-10-14");
  });

  it("resolves the day under a Stripes stripe and opens a new group event on it", async () => {
    const user = userEvent.setup();
    const { onNewGroupEvent } = renderStripes();

    pointOver(screen.getAllByTestId("stripe")[0], "2026-10-13");

    const menu = await screen.findByRole("menu");
    expect(within(menu).getByText("Tue 13 Oct")).toBeInTheDocument();
    await user.click(within(menu).getByRole("menuitem", { name: "New group event" }));
    expect(onNewGroupEvent).toHaveBeenCalledWith("2026-10-13");
  });

  it("leaves New group event out where nobody may create", async () => {
    renderLanes({ onNewGroupEvent: undefined });

    pointOver(screen.getByRole("button", { name: /Pat Doe/ }), "2026-10-14");

    const menu = await screen.findByRole("menu");
    expect(within(menu).queryByRole("menuitem", { name: "New group event" })).toBeNull();
    expect(within(menu).getByRole("menuitem", { name: "Request time off" })).toBeInTheDocument();
  });

  it("offers Open, Edit and Delete per group event on the day, then its birthdays", async () => {
    const user = userEvent.setup();
    const { items, handlers } = itemsFor(EVENT);
    renderLanes({ dayItems: items });

    pointOver(screen.getByRole("button", { name: /Pat Doe/ }), "2026-10-14");
    const menu = await screen.findByRole("menu");
    expect(within(menu).getByText("Pat turns 34")).toBeInTheDocument();
    await user.click(within(menu).getByRole("menuitem", { name: /Retro/ }));

    const sub = (await screen.findAllByRole("menu")).at(-1)!;
    expect(within(sub).getByRole("menuitem", { name: "Open" })).toBeInTheDocument();
    fireEvent.click(within(sub).getByRole("menuitem", { name: "Edit…" }));
    expect(handlers.onEdit).toHaveBeenCalledWith({ event: EVENT, occurrenceDate: "2026-10-14" });
  });

  it("disables Edit and Delete for a non-editor and says who can", async () => {
    const user = userEvent.setup();
    renderLanes({ dayItems: itemsFor({ ...EVENT, canEdit: false }).items });

    pointOver(screen.getByRole("button", { name: /Pat Doe/ }), "2026-10-14");
    const menu = await screen.findByRole("menu");
    await user.click(within(menu).getByRole("menuitem", { name: /Retro/ }));

    const sub = (await screen.findAllByRole("menu")).at(-1)!;
    expect(within(sub).getByRole("menuitem", { name: "Edit…" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
    expect(within(sub).getByRole("menuitem", { name: "Delete…" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
    expect(within(sub).getByText("Only Sam or a group admin can change this")).toBeInTheDocument();
  });

  it("opens a group event's card at the pointer", async () => {
    const user = userEvent.setup();
    renderLanes();

    pointOver(screen.getByRole("button", { name: /Pat Doe/ }), "2026-10-14");
    await user.click(
      within(await screen.findByRole("menu")).getByRole("menuitem", { name: /Retro/ })
    );
    fireEvent.click(
      within((await screen.findAllByRole("menu")).at(-1)!).getByRole("menuitem", { name: "Open" })
    );

    const card = await screen.findByRole("dialog");
    expect(within(card).getByText("Retro")).toBeInTheDocument();
    expect(within(card).getByText("Wed 14 Oct · 15:00–16:00")).toBeInTheDocument();
  });

  it("keeps drag-range selection working in Lanes", () => {
    const { onRangeSelect } = renderLanes();
    const cell = (date: string) => document.querySelector(`[data-date="${date}"]`)!;

    fireEvent.pointerDown(cell("2026-10-07"), mouse);
    fireEvent.pointerMove(cell("2026-10-09"), mouse);
    fireEvent.pointerUp(cell("2026-10-09"), mouse);

    expect(onRangeSelect).toHaveBeenCalledWith({ from: "2026-10-07", to: "2026-10-09" });
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("keeps drag-range selection and the day popover working in Stripes", async () => {
    const user = userEvent.setup();
    const { onRangeSelect } = renderStripes();

    fireEvent.pointerDown(stripesDay("7 October"), mouse);
    fireEvent.pointerMove(stripesDay("9 October"), mouse);
    fireEvent.pointerUp(stripesDay("9 October"), mouse);
    fireEvent.click(stripesDay("9 October"));
    expect(onRangeSelect).toHaveBeenCalledWith({ from: "2026-10-07", to: "2026-10-09" });

    await user.click(stripesDay("14 October"));
    expect(screen.getByRole("region", { name: /Away on/ })).toBeInTheDocument();
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
