import {
  vacationStatus,
  type UserSummary,
  type VacationKind,
  type VacationListItem,
  type VacationStatus,
} from "@/lib/api/types";

/**
 * A multi-day vacation is stored as one row per day. A `RequestGroup` collapses
 * the contiguous run of days that make up a single request into one entry, so
 * the UI can show a date range and act on the whole request at once.
 */
export interface RequestGroup {
  /** The first day's vacation id — a stable key and the row opened in detail. */
  id: string;
  userId: string;
  user: UserSummary;
  groupId: string;
  vacationType: VacationKind;
  status: VacationStatus;
  /** Inclusive ISO date span of the run. */
  from: string;
  to: string;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
  /** Every day-row id in the run, ordered by day — actions apply to all of them. */
  vacationIds: string[];
  dayCount: number;
}

/** Whole days since the Unix epoch for an ISO date, for contiguity checks. */
function dayNumber(iso: string): number {
  return Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / 86_400_000);
}

/**
 * Collapses per-day vacation rows into one entry per request. Days merge when
 * they share the same user, group, leave type, status and time window and are
 * calendar-consecutive — mirroring how the calendar and the approvals widget
 * already treat a contiguous same-type run as a single request. Status is part
 * of the key so a partially-decided request splits into same-status runs, which
 * keeps each row (and the status filters) unambiguous.
 *
 * The result is ordered by start day, then group, then user, for a stable table.
 */
export function groupVacationRequests(vacations: VacationListItem[]): RequestGroup[] {
  if (vacations.length === 0) return [];

  const keyOf = (v: VacationListItem): string =>
    [
      v.userId,
      v.groupId,
      v.vacationType,
      vacationStatus(v),
      v.startTime ?? "",
      v.endTime ?? "",
    ].join("|");

  const sorted = [...vacations].sort((a, b) => {
    const ka = keyOf(a);
    const kb = keyOf(b);
    if (ka !== kb) return ka < kb ? -1 : 1;
    return a.requestedDay < b.requestedDay ? -1 : a.requestedDay > b.requestedDay ? 1 : 0;
  });

  const groups: RequestGroup[] = [];
  let current: RequestGroup | null = null;
  let currentKey: string | null = null;
  let lastDay: number | null = null;

  for (const v of sorted) {
    const key = keyOf(v);
    const day = dayNumber(v.requestedDay);
    const contiguous =
      current !== null && key === currentKey && lastDay !== null && day - lastDay === 1;

    if (current && contiguous) {
      current.to = v.requestedDay;
      current.vacationIds.push(v.id);
      current.dayCount += 1;
    } else {
      current = {
        id: v.id,
        userId: v.userId,
        user: v.user,
        groupId: v.groupId,
        vacationType: v.vacationType,
        status: vacationStatus(v),
        from: v.requestedDay,
        to: v.requestedDay,
        startTime: v.startTime,
        endTime: v.endTime,
        note: v.note,
        vacationIds: [v.id],
        dayCount: 1,
      };
      groups.push(current);
    }
    currentKey = key;
    lastDay = day;
  }

  return groups.sort((a, b) => {
    if (a.from !== b.from) return a.from < b.from ? -1 : 1;
    if (a.groupId !== b.groupId) return a.groupId < b.groupId ? -1 : 1;
    return a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0;
  });
}
