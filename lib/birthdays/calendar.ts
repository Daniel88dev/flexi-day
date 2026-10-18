import type { BirthdayCalendarRow } from "@/lib/api/birthdays";
import type { DayItem } from "@/lib/calendar/day-items";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { firstName } from "@/lib/birthdays/birthday";

type BirthdayLabels = Dictionary["calendar"]["birthday"];

/** The calendar rows as day items, on the date the server placed each one. */
export function birthdayDayItems(
  rows: readonly BirthdayCalendarRow[],
  viewerId: string | null,
  labels: BirthdayLabels
): DayItem[] {
  return rows.map((row) => {
    const base = { key: `bd:${row.userId}:${row.date}`, kind: "birthday" as const, date: row.date };
    if (row.userId === viewerId) {
      return {
        ...base,
        title: row.age === null ? labels.yours : labels.yoursWithAge(row.age),
        detail: labels.changeInSettings,
        href: "/settings",
      };
    }
    const name = firstName(row.user.name);
    return {
      ...base,
      title: row.age === null ? labels.namesBirthday(name) : labels.nameTurns(name, row.age),
      detail: row.user.name,
    };
  });
}
