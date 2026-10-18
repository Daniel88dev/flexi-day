import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DayItemMarks, DayItemRows, DayItemsChip } from "../day-items";
import type { DayItem } from "@/lib/calendar/day-items";

const DATE = "2026-10-12";

const petra: DayItem = {
  key: "bd:petra",
  kind: "birthday",
  date: DATE,
  title: "Petra turns 34",
  detail: "Petra Nová",
};
const own: DayItem = {
  key: "bd:me",
  kind: "birthday",
  date: DATE,
  title: "Your birthday · 38",
  detail: "Change in Settings",
  href: "/settings",
};
function groupEvent(key: string, title: string, extra: Partial<DayItem> = {}): DayItem {
  return { key, kind: "groupEvent", date: DATE, title, ...extra };
}

describe("DayItemsChip", () => {
  it("renders nothing on a day without items", () => {
    const { container } = render(<DayItemsChip date={DATE} items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("opens the day's birthdays from a chip named by its count", async () => {
    const user = userEvent.setup();
    render(<DayItemsChip date={DATE} items={[petra, own]} />);

    await user.click(screen.getByRole("button", { name: "2 birthdays on 12 October" }));

    const list = screen.getByRole("list", { name: "12 October" });
    expect(within(list).getByText("Petra turns 34")).toBeVisible();
    expect(within(list).getByRole("link", { name: /Your birthday · 38/ })).toHaveAttribute(
      "href",
      "/settings"
    );
  });

  it("neither books the day nor starts a drag in the cell around it", async () => {
    const user = userEvent.setup();
    const onCellClick = vi.fn();
    const onCellPointerDown = vi.fn();
    render(
      <div onClick={onCellClick} onPointerDown={onCellPointerDown}>
        <DayItemsChip date={DATE} items={[petra]} />
      </div>
    );

    await user.click(screen.getByRole("button", { name: "1 birthday on 12 October" }));
    await user.click(screen.getByText("Petra turns 34"));

    expect(onCellClick).not.toHaveBeenCalled();
    expect(onCellPointerDown).not.toHaveBeenCalled();
  });

  it("shows the first group event's title and how many more the day holds", () => {
    render(
      <DayItemsChip
        date={DATE}
        items={[groupEvent("ge:1", "Offsite"), groupEvent("ge:2", "Retro"), petra]}
      />
    );

    const chip = screen.getByRole("button", {
      name: "2 group events, 1 birthday on 12 October",
    });
    expect(chip).toHaveTextContent("Offsite");
    expect(chip).toHaveTextContent("+1");
  });
});

describe("DayItemRows", () => {
  it("shows a timed item's times and runs its actions", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <DayItemRows
        label="12 October"
        items={[
          groupEvent("ge:1", "Standup", {
            time: "09:00–09:15",
            actions: [{ label: "Edit", onSelect: onEdit }],
          }),
        ]}
      />
    );

    expect(screen.getByText("09:00–09:15")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledOnce();
  });
});

const offsiteCard = {
  when: "Wed 21 Oct – Fri 23 Oct · All day",
  repeat: "Every year on 21 October",
  note: "Bring boots",
  addedBy: "Added by Bob Dvorak",
  group: "Dev Team",
};

describe("DayItemRows group event cards", () => {
  it("shows a non-editor the card's lines and the lock line instead of Edit and Delete", () => {
    render(
      <DayItemRows
        label="21 October"
        items={[
          groupEvent("ge:1", "Offsite", {
            card: { ...offsiteCard, locked: "Only Bob or a group admin can change this" },
          }),
        ]}
      />
    );

    const card = screen.getByRole("listitem");
    for (const line of [
      "Offsite",
      "Wed 21 Oct – Fri 23 Oct · All day",
      "Every year on 21 October",
      "Bring boots",
      "Added by Bob Dvorak",
      "Dev Team",
      "Only Bob or a group admin can change this",
    ]) {
      expect(within(card).getByText(line)).toBeVisible();
    }
    expect(within(card).queryByRole("button")).not.toBeInTheDocument();
  });

  it("gives an editor Edit and Delete, disabled until a handler arrives", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <DayItemRows
        label="21 October"
        items={[
          groupEvent("ge:1", "Offsite", {
            card: offsiteCard,
            actions: [
              { label: "Edit" },
              { label: "Delete", destructive: true, onSelect: onDelete },
            ],
          }),
        ]}
      />
    );

    expect(screen.getByRole("button", { name: "Edit" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledOnce();
    expect(screen.queryByText(/can change this/)).not.toBeInTheDocument();
  });
});

describe("DayItemsChip ribbon", () => {
  it("draws the ribbon on a day a multi-day event covers", () => {
    const { container } = render(
      <DayItemsChip date={DATE} items={[groupEvent("ge:1", "Offsite", { spansDays: true })]} />
    );
    expect(container.querySelector("[data-ribbon]")).not.toBeNull();
  });

  it("draws no ribbon for single-day events and birthdays", () => {
    const { container } = render(
      <DayItemsChip date={DATE} items={[groupEvent("ge:1", "Retro"), petra]} />
    );
    expect(container.querySelector("[data-ribbon]")).toBeNull();
  });
});

describe("DayItemMarks", () => {
  it("marks birthdays with a cake and group events with up to three dots", () => {
    const { container } = render(
      <DayItemMarks
        items={[
          petra,
          groupEvent("ge:1", "A"),
          groupEvent("ge:2", "B"),
          groupEvent("ge:3", "C"),
          groupEvent("ge:4", "D"),
        ]}
      />
    );

    expect(container.querySelectorAll("[data-mark='birthday']")).toHaveLength(1);
    expect(container.querySelectorAll("[data-mark='groupEvent']")).toHaveLength(3);
  });

  it("holds nothing a click could land on", () => {
    render(<DayItemMarks items={[petra]} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
