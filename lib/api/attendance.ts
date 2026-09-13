import { api } from "./client";
import type { Iso, UserSummary, UUID } from "./types";

export type AttendanceClosedBy = "USER" | "ADMIN" | "SWEEP";

export type AttendanceBreak = {
  id: UUID;
  sessionId: UUID;
  startedAt: Iso;
  endedAt: Iso | null;
  /** Closed by the clock-out or the sweep rather than by the person. */
  autoClosed: boolean;
  open: boolean;
};

export type AttendanceSession = {
  id: UUID;
  /** The organization's local day the session belongs to, fixed at clock-in. */
  businessDate: string;
  startedAt: Iso;
  endedAt: Iso | null;
  timezone: string;
  closedBy: AttendanceClosedBy | null;
  open: boolean;
  /** Null covers declined, never asked and erased alike; the UI must not tell them apart. */
  startLatitude: number | null;
  startLongitude: number | null;
  startAccuracy: number | null;
  endLatitude: number | null;
  endLongitude: number | null;
  endAccuracy: number | null;
  breaks: AttendanceBreak[];
};

/** Which clock a fix belongs to. */
export type AttendanceSessionEnd = "IN" | "OUT";

export type AttendanceLocationFix = {
  end: AttendanceSessionEnd;
  latitude: number;
  longitude: number;
  /** The browser's radius in metres; smaller is better, and only better wins. */
  accuracy: number;
};

export type AttendanceLocationResult = {
  /** False whenever the fix was late, no sharper, or simply not wanted. Never an error. */
  applied: boolean;
  end: AttendanceSessionEnd;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
};

export type AttendanceState = {
  organizationId: UUID;
  employmentId: UUID;
  /** Employed here once, not any more: history stays readable, writes are refused. */
  employmentEnded: boolean;
  /** Switched on *and* on a live paid plan. The only thing a lapse changes. */
  active: boolean;
  locationEnabled: boolean;
  timezone: string | null;
  businessDate: string | null;
  /**
   * Not necessarily one of `sessions`: a session left running across midnight
   * keeps the business date it started on.
   */
  openSession: AttendanceSession | null;
  openBreak: AttendanceBreak | null;
  sessions: AttendanceSession[];
  /**
   * The most recent session the ceiling sweep touched, on this business date or
   * the one before — not necessarily one of `sessions`, because the sweep runs
   * in the small hours and the day has moved on by the time anyone reads it.
   *
   * Two cases: `closedBy: "SWEEP"` is the session itself, and a break with
   * `autoClosed` is one closed inside a session that may still be open.
   */
  autoClosedSession: AttendanceSession | null;
};

/** The stable `context.reason` on a 409 from any of the four writes. */
export type AttendanceConflictReason =
  "SESSION_ALREADY_OPEN" | "NO_OPEN_SESSION" | "BREAK_ALREADY_OPEN" | "NO_OPEN_BREAK";

export type AttendanceConflictContext = {
  reason: AttendanceConflictReason;
  sessionId?: UUID;
  breakId?: UUID;
  startedAt?: Iso;
};

const scoped = (path: string, organizationId?: string | null) =>
  organizationId ? `${path}?organizationId=${encodeURIComponent(organizationId)}` : path;

/**
 * Everything the clock renders from, in one read. Omitting the organization
 * resolves the caller's own Employment, which is what the widget does before
 * it has been told which organization it is clocking into.
 */
export function getAttendanceState(organizationId?: string | null): Promise<AttendanceState> {
  return api<AttendanceState>(scoped(`/api/attendance/current`, organizationId));
}

const write = <T>(path: string, organizationId?: string | null) =>
  api<T>(`/api/attendance/${path}`, {
    method: "POST",
    body: organizationId ? { organizationId } : {},
  });

export const clockIn = (organizationId?: string | null) =>
  write<AttendanceSession>("clock-in", organizationId);

export const clockOut = (organizationId?: string | null) =>
  write<AttendanceSession>("clock-out", organizationId);

export const startBreak = (organizationId?: string | null) =>
  write<AttendanceBreak>("break/start", organizationId);

export const endBreak = (organizationId?: string | null) =>
  write<AttendanceBreak>("break/end", organizationId);

/**
 * Attaches one fix to one end of a session. The backend drops anything late or
 * no sharper than what it holds, answering 200 with `applied: false`, so the
 * caller has nothing to decide.
 */
export const updateSessionLocation = (sessionId: string, fix: AttendanceLocationFix) =>
  api<AttendanceLocationResult>(
    `/api/attendance/sessions/${encodeURIComponent(sessionId)}/location`,
    {
      method: "POST",
      body: fix,
    }
  );

/** Why nothing, or only half, is owed on a business date. */
export type AttendanceExclusionCause = "NOT_EMPLOYED" | "NON_WORKING_DAY" | "HOLIDAY" | "ABSENCE";

export type AttendanceExclusion = {
  cause: AttendanceExclusionCause;
  /** `HALF` halves the required time rather than taking the day. */
  extent: "FULL" | "HALF";
  /** The holiday's own name, or the absence's record type. Null where the cause says it all. */
  label: string | null;
};

/** One business date of a month: the figures, and the sessions behind them. */
export type AttendanceDay = {
  businessDate: string;
  presenceMinutes: number;
  breaksMinutes: number;
  deductedMinutes: number;
  workedMinutes: number;
  requiredMinutes: number;
  /**
   * Null on a date still to come, throughout `MONTHLY` mode, and on a day off
   * nobody worked.
   */
  balanceMinutes: number | null;
  upcoming: boolean;
  open: boolean;
  autoClosed: boolean;
  /** Null on an ordinary working day. */
  exclusion: AttendanceExclusion | null;
  /** Somebody at work on a day nobody owed: allowed, counted, and worth a look. */
  excludedClockIn: boolean;
  /** Auto-closed, clocked into a day off, or still open on a day that has passed. */
  flagged: boolean;
  sessions: AttendanceSession[];
};

export type AttendanceTotals = {
  presenceMinutes: number;
  workedMinutes: number;
  /** Over the dates already begun, which is what the balance is measured against. */
  requiredMinutes: number;
  /** Over the whole month, upcoming dates included. */
  requiredRangeMinutes: number;
  balanceMinutes: number;
  flaggedDays: number;
  /** Whole days off in the month, upcoming ones included. A half day is not one. */
  excludedDays: number;
};

export type AttendanceBalanceMode = "DAILY" | "MONTHLY";

/**
 * A month of the caller's own attendance. The rules travel with it — the screen
 * prints "of 8:00" and colours against the balance mode, and an employee can
 * read neither anywhere else.
 */
export type AttendanceMonth = {
  organizationId: UUID;
  employmentId: UUID;
  timezone: string | null;
  /** Today in that zone, so the screen knows which day is live. */
  businessDate: string | null;
  year: number;
  month: number;
  balanceMode: AttendanceBalanceMode;
  /** What the days were measured against: the override where there is one. */
  requiredMinutesPerDay: number;
  requiredMinutesOverride: number | null;
  breakMinutes: number;
  breakThresholdMinutes: number;
  days: AttendanceDay[];
  totals: AttendanceTotals;
};

export function getAttendanceMonth(
  year: number,
  month: number,
  organizationId?: string | null
): Promise<AttendanceMonth> {
  const params = new URLSearchParams({ year: String(year), month: String(month) });
  if (organizationId) params.set("organizationId", organizationId);
  return api<AttendanceMonth>(`/api/attendance/month?${params.toString()}`);
}

/** The longest range the team dashboard answers for, in days. */
export const TEAM_RANGE_MAX_DAYS = 93;

export type AttendanceTeamGroup = { id: UUID; groupName: string };

/** A day of the team dashboard: the month's figures without the sessions behind them. */
export type AttendanceTeamDay = Omit<AttendanceDay, "sessions">;

/** One row of the team dashboard. */
export type AttendanceTeamPerson = {
  employmentId: UUID;
  userId: UUID;
  user: UserSummary;
  /** The organization's live groups this person belongs to. Empty for a manager in none. */
  groups: AttendanceTeamGroup[];
  /** What their days were measured against: the override where there is one. */
  requiredMinutesPerDay: number;
  requiredMinutesOverride: number | null;
  days: AttendanceTeamDay[];
  totals: AttendanceTotals;
};

/** Somebody clocked in right now, whichever business date the session belongs to. */
export type AttendanceTeamOpenSession = {
  employmentId: UUID;
  userId: UUID;
  sessionId: UUID;
  businessDate: string;
  startedAt: Iso;
  onBreak: boolean;
  breakStartedAt: Iso | null;
};

/**
 * The viewer's standing, whether or not a group was named: `ORGANIZATION` for
 * an org admin, `GROUPS` for a group admin. The one thing that decides whether
 * a group filter makes sense.
 */
export type AttendanceTeamScope = "ORGANIZATION" | "GROUPS";

export type AttendanceTeam = {
  organizationId: UUID;
  timezone: string | null;
  /** Today in that zone, so the screen knows which column is live. */
  businessDate: string | null;
  from: string;
  to: string;
  balanceMode: AttendanceBalanceMode;
  /** The organization's figure; a row carries its own where it differs. */
  requiredMinutesPerDay: number;
  breakMinutes: number;
  breakThresholdMinutes: number;
  scope: AttendanceTeamScope;
  /** The group the answer was narrowed to, null for the viewer's whole audience. */
  group: AttendanceTeamGroup | null;
  people: AttendanceTeamPerson[];
  inNow: AttendanceTeamOpenSession[];
};

export type TeamAttendanceParams = {
  organizationId: string;
  from: string;
  to: string;
  groupId?: string | null;
};

/**
 * The team dashboard: every Employment the caller may see over a range. The
 * backend decides the scope from the visibility matrix and answers 403 to
 * anyone who administers nothing, so the screen asks only for an admin.
 */
export function getTeamAttendance(params: TeamAttendanceParams): Promise<AttendanceTeam> {
  const query = new URLSearchParams({
    organizationId: params.organizationId,
    from: params.from,
    to: params.to,
  });
  if (params.groupId) query.set("groupId", params.groupId);
  return api<AttendanceTeam>(`/api/attendance/team?${query.toString()}`);
}

/** Everything a session's timeline can say. */
export type AttendanceEventKind =
  | "CLOCK_IN"
  | "CLOCK_OUT"
  | "BREAK_START"
  | "BREAK_END"
  | "LOCATION_UPDATED"
  | "SESSION_EDITED"
  | "BREAK_EDITED"
  | "BREAK_DELETED"
  | "SESSION_DELETED";

/**
 * One entry of the timeline. A null `user` is the ceiling sweep, or an account
 * that has since gone — the UI must not tell those apart, since neither is a
 * person who can be asked about it.
 *
 * `before` and `after` carry only the fields the change touched, so their shape
 * follows `eventType`. Nothing renders them raw.
 */
export type AttendanceEvent = {
  id: UUID;
  sessionId: UUID;
  eventType: AttendanceEventKind;
  user: UserSummary | null;
  before: unknown;
  after: unknown;
  createdAt: Iso;
};

/** One person's business date: what the correction dialog opens onto. */
export type AttendanceDaySessions = {
  organizationId: UUID;
  employmentId: UUID;
  userId: UUID;
  businessDate: string;
  timezone: string | null;
  sessions: AttendanceSession[];
};

/** The stable `context.reason` a correction can be refused with. */
export type AttendanceCorrectionReason =
  | "SELF_SERVICE_WINDOW"
  | "END_BEFORE_START"
  | "BREAK_OUTSIDE_SESSION"
  | "SESSION_ALREADY_OPEN"
  | "BREAK_ALREADY_OPEN";

/** A patch of one end, or both. `endedAt: null` reopens; an absent key changes nothing. */
export type AttendanceCorrection = { startedAt?: string; endedAt?: string | null };

export type AttendanceDayParams = {
  organizationId: string;
  businessDate: string;
  /** Somebody else's, for an admin; omitted for the caller's own. */
  userId?: string | null;
};

export function getAttendanceDay(params: AttendanceDayParams): Promise<AttendanceDaySessions> {
  const query = new URLSearchParams({
    organizationId: params.organizationId,
    businessDate: params.businessDate,
  });
  if (params.userId) query.set("userId", params.userId);
  return api<AttendanceDaySessions>(`/api/attendance/day?${query.toString()}`);
}

export function getSessionEvents(sessionId: string): Promise<AttendanceEvent[]> {
  return api<{ sessionId: UUID; events: AttendanceEvent[] }>(
    `/api/attendance/sessions/${encodeURIComponent(sessionId)}/events`
  ).then((answer) => answer.events);
}

/** The four corrections. Each answers with the session as it now stands. */
export const correctSession = (sessionId: string, patch: AttendanceCorrection) =>
  api<AttendanceSession>(`/api/attendance/sessions/${encodeURIComponent(sessionId)}`, {
    method: "PATCH",
    body: patch,
  });

export const correctBreak = (breakId: string, patch: AttendanceCorrection) =>
  api<AttendanceSession>(`/api/attendance/breaks/${encodeURIComponent(breakId)}`, {
    method: "PATCH",
    body: patch,
  });

export const removeBreak = (breakId: string) =>
  api<AttendanceSession>(`/api/attendance/breaks/${encodeURIComponent(breakId)}`, {
    method: "DELETE",
  });

export const removeSession = (sessionId: string) =>
  api<AttendanceSession>(`/api/attendance/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  });
