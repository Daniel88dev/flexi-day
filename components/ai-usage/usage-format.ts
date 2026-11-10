import type { Dictionary } from "@/lib/i18n";

export type UsageCopy = Dictionary["aiUsage"];

const utcDate = (day: string) => new Date(`${day}T00:00:00Z`);

/** A UTC week by its Monday, as "2–8 Nov". */
export function weekLabel(weekStart: string, dateLocale: string): string {
  const start = utcDate(weekStart);
  const end = new Date(start.getTime() + 6 * 86_400_000);
  return new Intl.DateTimeFormat(dateLocale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).formatRange(start, end);
}

/** A UTC day, as "30 Oct". */
export function dayLabel(day: string, dateLocale: string): string {
  return new Intl.DateTimeFormat(dateLocale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(utcDate(day));
}

/** A moment in the viewer's time zone: "Thu 12 Nov, 08:14", or with the long weekday. */
export function dateTimeLabel(at: string, dateLocale: string, longWeekday: boolean): string {
  return new Intl.DateTimeFormat(dateLocale, {
    weekday: longWeekday ? "long" : "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(at));
}

/** The time of day in the viewer's time zone, as "01:00". */
export function timeLabel(at: string, dateLocale: string): string {
  return new Intl.DateTimeFormat(dateLocale, { hour: "2-digit", minute: "2-digit" }).format(
    new Date(at)
  );
}
