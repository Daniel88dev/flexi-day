import type { CalendarRange } from "@/components/dashboard/leave-calendar";
import { CalendarRecordType, type BankHoliday } from "@/lib/api/types";

/**
 * Turns bank holidays into calendar ranges for one visible month. Same-day
 * holidays (several countries in the MINE scope) collapse into a single range —
 * the calendar pins every bank-holiday pill to the same grid row, so two
 * ranges on one date would overlap.
 */
export function bankHolidaysToRanges(
  holidays: BankHoliday[],
  year: number,
  month: number
): CalendarRange[] {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const namesByDate = new Map<string, string[]>();

  for (const holiday of holidays) {
    if (!holiday.date.startsWith(prefix)) continue;
    const names = namesByDate.get(holiday.date) ?? [];
    if (!names.includes(holiday.name)) names.push(holiday.name);
    namesByDate.set(holiday.date, names);
  }

  return Array.from(namesByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, names]) => {
      const day = Number(date.slice(8, 10));
      return {
        id: `bh-${date}`,
        who: "all",
        type: CalendarRecordType.BankHoliday,
        from: day,
        to: day,
        note: names.join(" · "),
        vacationIds: [],
      };
    });
}
