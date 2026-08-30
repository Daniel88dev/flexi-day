import {
  vacationStatus,
  type UserSummary,
  type CalendarRecordType,
  type VacationListItem,
  type VacationStatus,
} from "@/lib/api/types";

// One request collapsed from its per-day rows. `id` is the first day's id (row key + detail target).
export interface RequestGroup {
  id: string;
  userId: string;
  user: UserSummary;
  groupId: string;
  vacationType: CalendarRecordType;
  status: VacationStatus;
  from: string;
  to: string;
  startTime: string | null;
  endTime: string | null;
  halfDay: boolean;
  note: string | null;
  vacationIds: string[];
  /** Calendar days in the run, not allowance days — a half-day run counts 0.5 each. */
  dayCount: number;
  /** ANDed across the run, so a bulk action never offers more than every day allows. */
  canApprove: boolean;
}

function dayNumber(iso: string): number {
  return Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / 86_400_000);
}

// Collapses per-day rows into one entry per contiguous run of same user/group/type/status/time.
// Status is in the key so a partially-decided request splits into unambiguous same-status rows.
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
      // Keeps a run homogeneous, so the row can label the whole span at once.
      String(v.halfDay),
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
      current.canApprove &&= v.canApprove;
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
        halfDay: v.halfDay,
        note: v.note,
        vacationIds: [v.id],
        dayCount: 1,
        canApprove: v.canApprove,
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
