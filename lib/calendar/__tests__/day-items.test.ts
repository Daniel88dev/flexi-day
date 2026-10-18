import { describe, expect, it } from "vitest";
import { countDayItems, dayItemsByDate, type DayItem } from "../day-items";

function item(key: string, date: string, kind: DayItem["kind"] = "birthday"): DayItem {
  return { key, kind, date, title: key };
}

describe("dayItemsByDate", () => {
  it("files each item under the day it shows on", () => {
    const byDate = dayItemsByDate([
      item("a", "2026-10-12"),
      item("b", "2026-10-14"),
      item("c", "2026-10-12"),
    ]);

    expect(byDate.get("2026-10-12")?.map((i) => i.key)).toEqual(["a", "c"]);
    expect(byDate.get("2026-10-14")?.map((i) => i.key)).toEqual(["b"]);
    expect(byDate.has("2026-10-13")).toBe(false);
  });

  it("puts a day's group events before its birthdays and keeps each kind's order", () => {
    const byDate = dayItemsByDate([
      item("bd-1", "2026-10-12"),
      item("ge-1", "2026-10-12", "groupEvent"),
      item("bd-2", "2026-10-12"),
      item("ge-2", "2026-10-12", "groupEvent"),
    ]);

    expect(byDate.get("2026-10-12")?.map((i) => i.key)).toEqual(["ge-1", "ge-2", "bd-1", "bd-2"]);
  });
});

describe("countDayItems", () => {
  it("counts group events and birthdays apart", () => {
    expect(
      countDayItems([
        item("bd-1", "2026-10-12"),
        item("ge-1", "2026-10-12", "groupEvent"),
        item("bd-2", "2026-10-12"),
      ])
    ).toEqual({ events: 1, birthdays: 2 });
  });
});
