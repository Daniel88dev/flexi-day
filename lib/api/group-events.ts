import { api } from "./client";
import type { IsoDate, UserSummary } from "./types";

/** A recurring group event's rule. `weekdays` count 0 = Monday … 6 = Sunday. */
export type RepeatRule = {
  freq: "daily" | "weekly" | "monthly" | "yearly";
  /** 1-99. */
  interval: number;
  /** Weekly only, always holds the start's weekday; empty otherwise. */
  weekdays: number[];
  /** Monthly only, read off the start date; null otherwise. */
  monthlyMode: "day" | "weekday" | "lastWeekday" | null;
  /** Inclusive; null repeats forever. */
  until: IsoDate | null;
};

/** One row of `GET /api/group-events`, unexpanded: the client works out its occurrences. */
export type GroupEventRow = {
  id: string;
  groupId: string;
  groupName: string;
  title: string;
  note: string | null;
  startDate: IsoDate;
  /** Inclusive. */
  endDate: IsoDate;
  /** `HH:MM`; both null on an all-day group event. */
  startTime: string | null;
  endTime: string | null;
  repeat: RepeatRule | null;
  skippedDates: IsoDate[];
  /** Set on a one-off that replaced one date of a recurring group event. */
  recurringEventId: string | null;
  originalDate: IsoDate | null;
  /** Null once the creator deleted their account. */
  createdBy: UserSummary | null;
  canEdit: boolean;
  createdAt: string;
  updatedAt: string;
};

/** One of the caller's groups and whether they may add a group event to it now. */
export type GroupEventGroup = { groupId: string; groupName: string; canCreate: boolean };

export type ListGroupEventsParams = {
  year: number;
  /** 1-12. */
  month: number;
  /** One group; without it, every group the caller is a member of. */
  groupId?: string | null;
};

/** The month padded six days each side, like the vacation calendar. */
export function listGroupEvents(params: ListGroupEventsParams): Promise<GroupEventRow[]> {
  const q = new URLSearchParams({ year: String(params.year), month: String(params.month) });
  if (params.groupId) q.set("groupId", params.groupId);
  return api<GroupEventRow[]>(`/api/group-events?${q.toString()}`);
}

export function listGroupEventGroups(): Promise<GroupEventGroup[]> {
  return api<GroupEventGroup[]>("/api/group-events/groups");
}

/** Body of `POST /api/group-events`. `endDate` defaults to `startDate`; times both or neither. */
export type CreateGroupEventInput = {
  groupId: string;
  title: string;
  note?: string | null;
  startDate: IsoDate;
  endDate?: IsoDate;
  startTime?: string | null;
  endTime?: string | null;
  repeat?: RepeatRule | null;
};

export type GroupEventScope = "this" | "following" | "all";

/** What an edit changes. A missing field keeps its value; `null` clears it (`repeat: null` stops repeating). */
export type GroupEventChanges = Partial<{
  title: string;
  note: string | null;
  startDate: IsoDate;
  endDate: IsoDate;
  startTime: string | null;
  endTime: string | null;
  repeat: RepeatRule | null;
}>;

/** `scope` is required on a recurring group event and ignored on a one-off. */
export type GroupEventEditRequest = {
  scope?: GroupEventScope;
  occurrenceDate?: IsoDate;
  changes: GroupEventChanges;
};

export type GroupEventDeleteRequest = { scope?: GroupEventScope; occurrenceDate?: IsoDate };

/** What an edit or delete wrote: the live rows and the ids it removed. */
export type GroupEventWriteResult = {
  droppedOneOffs: number;
  events: GroupEventRow[];
  deletedIds: string[];
};

export function createGroupEvent(input: CreateGroupEventInput): Promise<GroupEventRow> {
  return api<GroupEventRow>("/api/group-events", { method: "POST", body: input });
}

export function updateGroupEvent(
  id: string,
  request: GroupEventEditRequest
): Promise<GroupEventWriteResult> {
  return api<GroupEventWriteResult>(`/api/group-events/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: request,
  });
}

function scopeQuery(request: GroupEventDeleteRequest): URLSearchParams {
  const q = new URLSearchParams();
  if (request.scope) q.set("scope", request.scope);
  if (request.occurrenceDate) q.set("occurrenceDate", request.occurrenceDate);
  return q;
}

/** A dry run of the edit: how many one-off changes it would drop. */
export function groupEventImpact(
  id: string,
  request: GroupEventEditRequest
): Promise<{ droppedOneOffs: number }> {
  const q = scopeQuery(request);
  q.set("changes", JSON.stringify(request.changes));
  return api<{ droppedOneOffs: number }>(
    `/api/group-events/${encodeURIComponent(id)}/impact?${q.toString()}`
  );
}

export function deleteGroupEvent(
  id: string,
  request: GroupEventDeleteRequest
): Promise<GroupEventWriteResult> {
  const q = scopeQuery(request).toString();
  return api<GroupEventWriteResult>(
    `/api/group-events/${encodeURIComponent(id)}${q ? `?${q}` : ""}`,
    { method: "DELETE" }
  );
}
