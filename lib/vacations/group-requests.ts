import {
  vacationStatus,
  type UserSummary,
  type WireRecordType,
  type VacationListItem,
  type VacationStatus,
} from "@/lib/api/types";

// One Request in one state, collapsed from its per-day rows. `id` is the first day's id (row key + detail target).
export interface RequestGroup {
  id: string;
  userId: string;
  user: UserSummary;
  groupId: string;
  mirroredFromGroupName: string | null;
  vacationType: WireRecordType;
  status: VacationStatus;
  from: string;
  to: string;
  startTime: string | null;
  endTime: string | null;
  halfDay: boolean;
  note: string | null;
  vacationIds: string[];
  /** The rows in the group, not allowance days. */
  dayCount: number;
  /** ANDed across the group, so a bulk action never offers more than every day allows. */
  canApprove: boolean;
}

// Membership comes from `requestId`, never day adjacency: a Request skips weekends and holidays,
// and two Requests can sit on adjacent days. Status is in the key so each group acts on one state.
export function groupVacationRequests(vacations: VacationListItem[]): RequestGroup[] {
  const keyOf = (v: VacationListItem): string =>
    [
      v.userId,
      v.groupId,
      v.vacationType,
      v.requestId,
      vacationStatus(v),
      v.startTime ?? "",
      v.endTime ?? "",
      // Keeps a group homogeneous, so the row can label the whole span at once.
      String(v.halfDay),
    ].join("|");

  const sortedByDay = [...vacations].sort((a, b) =>
    a.requestedDay < b.requestedDay ? -1 : a.requestedDay > b.requestedDay ? 1 : 0
  );

  const groups = new Map<string, RequestGroup>();
  for (const v of sortedByDay) {
    const key = keyOf(v);
    const current = groups.get(key);
    if (current) {
      current.to = v.requestedDay;
      current.vacationIds.push(v.id);
      current.dayCount += 1;
      current.canApprove &&= v.canApprove;
      continue;
    }
    groups.set(key, {
      id: v.id,
      userId: v.userId,
      user: v.user,
      groupId: v.groupId,
      mirroredFromGroupName: v.mirroredFromGroupName ?? null,
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
    });
  }

  return [...groups.values()].sort((a, b) => {
    if (a.from !== b.from) return a.from < b.from ? -1 : 1;
    if (a.groupId !== b.groupId) return a.groupId < b.groupId ? -1 : 1;
    return a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0;
  });
}
