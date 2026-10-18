import { describe, expect, it } from "vitest";
import { birthdayDayItems } from "../calendar";
import { dayItemsByDate } from "@/lib/calendar/day-items";
import type { BirthdayCalendarRow } from "@/lib/api/birthdays";
import { en } from "@/lib/i18n/dictionaries/en";
import { cs } from "@/lib/i18n/dictionaries/cs";

const VIEWER = "u-olivia";

function row(
  userId: string,
  name: string,
  date: string,
  year: number | null,
  age: number | null
): BirthdayCalendarRow {
  const [, m, d] = date.split("-").map(Number);
  return {
    userId,
    user: { id: userId, name, initials: "XX", avatarColor: "hsl(0 0% 50%)" },
    date,
    month: m,
    day: d,
    year,
    age,
  };
}

describe("birthdayDayItems", () => {
  it("names a colleague by first name with the age they turn", () => {
    const [item] = birthdayDayItems(
      [row("u-petra", "Petra Nová", "2026-10-12", 1992, 34)],
      VIEWER,
      en.calendar.birthday
    );

    expect(item).toMatchObject({
      kind: "birthday",
      date: "2026-10-12",
      title: "Petra turns 34",
      detail: "Petra Nová",
    });
    expect(item.href).toBeUndefined();
  });

  it("shows no age for a colleague who left the year out", () => {
    const [item] = birthdayDayItems(
      [row("u-tomas", "Tomáš Dvořák", "2026-10-14", null, null)],
      VIEWER,
      en.calendar.birthday
    );

    expect(item.title).toBe("Tomáš's birthday");
  });

  it("links the viewer's own birthday to Settings", () => {
    const [withYear, withoutYear] = birthdayDayItems(
      [
        row(VIEWER, "Olivia Brandt", "2026-10-25", 1988, 38),
        row(VIEWER, "Olivia Brandt", "2026-11-03", null, null),
      ],
      VIEWER,
      en.calendar.birthday
    );

    expect(withYear).toMatchObject({
      title: "Your birthday · 38",
      detail: "Change in Settings",
      href: "/settings",
    });
    expect(withoutYear.title).toBe("Your birthday");
  });

  it("files a 29 February birthday on 28 February 2027, the date the server sends", () => {
    const items = birthdayDayItems(
      [{ ...row("u-leap", "Leo Leap", "2027-02-28", 1990, 37), month: 2, day: 29 }],
      VIEWER,
      en.calendar.birthday
    );

    const byDate = dayItemsByDate(items);
    expect(byDate.get("2027-02-28")?.map((i) => i.title)).toEqual(["Leo turns 37"]);
    expect(byDate.has("2027-03-01")).toBe(false);
  });

  it("speaks Czech with the Czech dictionary", () => {
    const items = birthdayDayItems(
      [
        row("u-petra", "Petra Nová", "2026-10-12", 1992, 34),
        row("u-tomas", "Tomáš Dvořák", "2026-10-14", null, null),
        row(VIEWER, "Olivia Brandt", "2026-10-25", 1988, 38),
      ],
      VIEWER,
      cs.calendar.birthday
    );

    expect(items.map((i) => i.title)).toEqual([
      "Petra slaví 34",
      "Tomáš má narozeniny",
      "Vaše narozeniny · 38",
    ]);
  });
});
