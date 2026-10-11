import type { Dictionary } from "@/lib/i18n";

export function relativeTime(iso: string, t: Dictionary): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return t.calSync.rel.justNow;
  if (mins < 60) return t.calSync.rel.minAgo(mins);
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return t.calSync.rel.hoursAgo(hrs);
  const days = Math.round(hrs / 24);
  if (days === 1) return t.calSync.rel.yesterday;
  if (days < 30) return t.calSync.rel.daysAgo(days);
  return new Date(iso).toLocaleDateString(t.common.dateLocale, { day: "numeric", month: "short" });
}
