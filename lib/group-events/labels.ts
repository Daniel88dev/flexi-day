import type { RepeatRule } from "@/lib/api/group-events";
import type { IsoDate } from "@/lib/api/types";
import { formatIsoDate } from "@/lib/calendar/month-grid";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { monthlyWeekdayPosition } from "./occurrences";

const MONDAY_TO_FRIDAY = "0,1,2,3,4";

/** The rule in words, read off the start date: "Every 2 weeks on Tue, Thu, until 3 November 2026". */
export function ruleSummary(startDate: IsoDate, rule: RepeatRule, t: Dictionary): string {
  const labels = t.calendar.groupEvent.repeat;
  const locale = t.common.dateLocale;
  const n = rule.interval;
  let text: string;
  switch (rule.freq) {
    case "daily":
      text = labels.daily(n);
      break;
    case "weekly": {
      const days = [...rule.weekdays].sort((a, b) => a - b);
      text =
        n === 1 && days.join() === MONDAY_TO_FRIDAY
          ? labels.everyWeekday
          : labels.weekly(n, days.map((d) => t.calendar.weekdaysShort[d]).join(", "));
      break;
    }
    case "monthly": {
      const weekday = formatIsoDate(startDate, locale, { weekday: "long" });
      if (rule.monthlyMode === "weekday" || rule.monthlyMode === "lastWeekday") {
        const position = monthlyWeekdayPosition(startDate, rule);
        text =
          position === -1
            ? labels.monthlyOnLastWeekday(n, weekday)
            : labels.monthlyOnWeekday(n, position, weekday);
      } else {
        text = labels.monthlyOnDay(n, Number(startDate.slice(8, 10)));
      }
      break;
    }
    case "yearly":
      text = labels.yearly(n, formatIsoDate(startDate, locale, { day: "numeric", month: "long" }));
      break;
  }
  return rule.until
    ? labels.until(
        text,
        formatIsoDate(rule.until, locale, { day: "numeric", month: "long", year: "numeric" })
      )
    : text;
}

/** "Wed 21 Oct", the date format of a group event card. */
export function cardDate(date: IsoDate, t: Dictionary): string {
  return formatIsoDate(date, t.common.dateLocale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** The card's date and time line for one occurrence. */
export function whenLabel(
  occurrence: { startDate: IsoDate; endDate: IsoDate },
  times: { startTime: string | null; endTime: string | null },
  t: Dictionary
): string {
  const start = cardDate(occurrence.startDate, t);
  const singleDay = occurrence.startDate === occurrence.endDate;
  if (times.startTime === null || times.endTime === null) {
    const dates = singleDay ? start : `${start} – ${cardDate(occurrence.endDate, t)}`;
    return `${dates} · ${t.calendar.groupEvent.allDay}`;
  }
  if (singleDay) return `${start} · ${times.startTime}–${times.endTime}`;
  return `${start} ${times.startTime} – ${cardDate(occurrence.endDate, t)} ${times.endTime}`;
}
