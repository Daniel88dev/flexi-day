import type { CalendarRange } from "@/components/dashboard/leave-calendar";
import { CalendarRecordType, type BankHoliday, type IsoDate } from "@/lib/api/types";

/**
 * Turns bank holidays into calendar ranges for the visible dates `from`..`to`. Same-day
 * holidays (several countries in the MINE scope) collapse into a single range —
 * the calendar pins every bank-holiday pill to the same grid row, so two
 * ranges on one date would overlap.
 */
export function bankHolidaysToRanges(
  holidays: BankHoliday[],
  from: IsoDate,
  to: IsoDate
): CalendarRange[] {
  const namesByDate = new Map<string, string[]>();

  for (const holiday of holidays) {
    if (holiday.date < from || holiday.date > to) continue;
    const names = namesByDate.get(holiday.date) ?? [];
    if (!names.includes(holiday.name)) names.push(holiday.name);
    namesByDate.set(holiday.date, names);
  }

  return Array.from(namesByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, names]) => ({
      id: `bh-${date}`,
      who: "all",
      type: CalendarRecordType.BankHoliday,
      from: date,
      to: date,
      note: names.join(" · "),
      vacationIds: [],
    }));
}
