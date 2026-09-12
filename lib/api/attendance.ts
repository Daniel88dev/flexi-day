import { api } from "./client";
import type { Iso, UUID } from "./types";

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
