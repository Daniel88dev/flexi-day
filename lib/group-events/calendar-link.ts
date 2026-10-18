import type { IsoDate } from "@/lib/api/types";

const GROUP_PARAM = "groupId";
const MONTH_PARAM = "month";

export interface CalendarLanding {
  groupId: string;
  year: number;
  /** 1-12. */
  month: number;
}

/** The dashboard in Group scope on the event's group and the month of its first date. */
export function groupEventCalendarHref(event: { groupId: string; startDate: IsoDate }): string {
  const query = new URLSearchParams({
    [GROUP_PARAM]: event.groupId,
    [MONTH_PARAM]: event.startDate.slice(0, 7),
  });
  return `/dashboard/?${query.toString()}`;
}

/** What a `groupEventCalendarHref` link asks the dashboard to show, or null. */
export function calendarLanding(search: URLSearchParams | string): CalendarLanding | null {
  const params = new URLSearchParams(search);
  const groupId = params.get(GROUP_PARAM);
  const match = /^(\d{4})-(\d{2})$/.exec(params.get(MONTH_PARAM) ?? "");
  if (!groupId || !match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { groupId, year: Number(match[1]), month };
}

/** The query without the landing parameters, with the leading `?`, or "" when nothing is left. */
export function withoutCalendarLanding(search: URLSearchParams | string): string {
  const params = new URLSearchParams(search);
  params.delete(GROUP_PARAM);
  params.delete(MONTH_PARAM);
  const query = params.toString();
  return query ? `?${query}` : "";
}
