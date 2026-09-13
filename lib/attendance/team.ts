import type { AttendanceTeamPerson } from "@/lib/api/attendance";
import type { GroupListItem } from "@/lib/api/types";
import { addDays, addMonths, startOfWeek, yearMonthOf, type YearMonth } from "./month";

export type TeamView = "week" | "month" | "range";

export type DateRange = { from: string; to: string };

const pad = (value: number) => String(value).padStart(2, "0");

function monthRange({ year, month }: YearMonth): DateRange {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${year}-${pad(month)}-01`, to: `${year}-${pad(month)}-${pad(last)}` };
}

export function weekRange(anchor: string): DateRange {
  const monday = startOfWeek(anchor);
  return { from: monday, to: addDays(monday, 6) };
}

/** The week or month the anchor falls in. A custom range keeps its own ends. */
export function rangeOf(view: TeamView, anchor: string, custom: DateRange): DateRange {
  if (view === "week") return weekRange(anchor);
  if (view === "month") return monthRange(yearMonthOf(anchor));
  return custom;
}

/** The anchor one week or one month over. */
export function stepAnchor(view: "week" | "month", anchor: string, direction: -1 | 1): string {
  if (view === "week") return addDays(startOfWeek(anchor), direction * 7);
  const { year, month } = addMonths(yearMonthOf(anchor), direction);
  return `${year}-${pad(month)}-01`;
}

/** Whole days from `from` to `to`, both included. Zero or less when the range is inside out. */
export function daysInRange({ from, to }: DateRange): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Number.isNaN(ms) ? 0 : Math.round(ms / 86_400_000) + 1;
}

/**
 * The day the phone opens on: today when it is in the range, else the day
 * nearest to it — the end of a past range, the start of one still to come.
 */
export function defaultDay({ from, to }: DateRange, today: string | null): string {
  if (today === null) return to;
  if (today < from) return from;
  if (today > to) return to;
  return today;
}

export type TeamOrganization = { id: string; name: string };

/**
 * The organizations whose dashboard the viewer may open: the one they
 * administer, then any their administered groups belong to. UI only — the
 * backend refuses anyone the matrix does not admit.
 */
export function teamOrganizations(
  administered: TeamOrganization | null,
  groups: GroupListItem[],
  viewerId: string | undefined
): TeamOrganization[] {
  const found = new Map<string, TeamOrganization>();
  if (administered) found.set(administered.id, administered);
  for (const group of groups) {
    const admin = group.managerUserId === viewerId || group.membership?.adminAccess === true;
    if (!admin || found.has(group.organizationId)) continue;
    found.set(group.organizationId, {
      id: group.organizationId,
      name: group.organization?.name ?? group.groupName,
    });
  }
  return [...found.values()];
}

/** Whether anybody in the range was at work, which is what "empty" means on the dashboard. */
export function anyPresence(people: AttendanceTeamPerson[]): boolean {
  return people.some((person) => person.days.some((day) => day.presenceMinutes > 0));
}
