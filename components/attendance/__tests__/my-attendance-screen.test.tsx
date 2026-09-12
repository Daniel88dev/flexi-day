import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { NO_SESSION_LOCATION, renderWithClient } from "@/lib/test-utils";
import type { AttendanceState } from "@/lib/api/attendance";
import { MyAttendanceScreen } from "../my-attendance-screen";

const query = { data: undefined as AttendanceState | undefined, isPending: false };
const idle = { mutate: vi.fn(), isPending: false, error: null };

vi.mock("@/lib/api/queries", () => ({
  useAttendanceState: () => query,
  useClockIn: () => idle,
  useClockOut: () => idle,
  useStartBreak: () => idle,
  useEndBreak: () => idle,
  useMySettings: () => ({ data: { attendanceLocationNoticeDismissed: true } }),
  useUpdateMySettings: () => idle,
}));

const ZONE = "Europe/Prague";

const state = (overrides: Partial<AttendanceState> = {}): AttendanceState => ({
  organizationId: "org-1",
  employmentId: "emp-1",
  employmentEnded: false,
  active: true,
  locationEnabled: false,
  timezone: ZONE,
  businessDate: "2026-09-11",
  openSession: null,
  openBreak: null,
  sessions: [],
  autoClosedSession: null,
  ...overrides,
});

describe("MyAttendanceScreen", () => {
  beforeEach(() => {
    query.data = state();
    query.isPending = false;
  });

  it("carries the clock beside today, and says when nothing is recorded", () => {
    renderWithClient(<MyAttendanceScreen />);

    expect(screen.getByRole("heading", { name: "My attendance" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clock in" })).toBeInTheDocument();
    expect(screen.getByText("Nothing recorded today yet.")).toBeInTheDocument();
  });

  it("lists the day's work and break stretches with their times", () => {
    query.data = state({
      sessions: [
        {
          id: "session-1",
          businessDate: "2026-09-11",
          startedAt: "2026-09-11T06:00:00Z",
          endedAt: "2026-09-11T14:00:00Z",
          timezone: ZONE,
          closedBy: "USER",
          ...NO_SESSION_LOCATION,
          open: false,
          breaks: [
            {
              id: "break-1",
              sessionId: "session-1",
              startedAt: "2026-09-11T10:00:00Z",
              endedAt: "2026-09-11T10:30:00Z",
              autoClosed: false,
              open: false,
            },
          ],
        },
      ],
    });
    renderWithClient(<MyAttendanceScreen />);

    expect(screen.getByText("08:00 – 12:00")).toBeInTheDocument();
    expect(screen.getByText("12:00 – 12:30")).toBeInTheDocument();
    expect(screen.getByText("12:30 – 16:00")).toBeInTheDocument();
    // Presence, in both the widget's totals and the day's.
    expect(screen.getAllByText("8:00")).toHaveLength(2);
    expect(screen.getAllByText("0:30").length).toBeGreaterThan(0);
  });

  it("marks the stretch that is still running", () => {
    query.data = state({
      openSession: {
        id: "session-1",
        businessDate: "2026-09-11",
        startedAt: "2026-09-11T06:00:00Z",
        endedAt: null,
        timezone: ZONE,
        closedBy: null,
        ...NO_SESSION_LOCATION,
        open: true,
        breaks: [],
      },
      sessions: [
        {
          id: "session-1",
          businessDate: "2026-09-11",
          startedAt: "2026-09-11T06:00:00Z",
          endedAt: null,
          timezone: ZONE,
          closedBy: null,
          ...NO_SESSION_LOCATION,
          open: true,
          breaks: [],
        },
      ],
    });
    renderWithClient(<MyAttendanceScreen />);

    expect(screen.getByText(/Still open/)).toBeInTheDocument();
  });
  describe("where the day was clocked", () => {
    const closed = (overrides = {}) => ({
      id: "session-1",
      businessDate: "2026-09-11",
      startedAt: "2026-09-11T06:00:00Z",
      endedAt: "2026-09-11T14:00:00Z",
      timezone: ZONE,
      closedBy: "USER" as const,
      ...NO_SESSION_LOCATION,
      open: false,
      breaks: [],
      ...overrides,
    });

    it("leaves the strip off where the organization does not record location", () => {
      query.data = state({ sessions: [closed()] });
      renderWithClient(<MyAttendanceScreen />);

      expect(screen.queryByTestId("session-location")).toBeNull();
    });

    it("shows the strip, empty, where the organization does", () => {
      query.data = state({ locationEnabled: true, sessions: [closed()] });
      renderWithClient(<MyAttendanceScreen />);

      expect(screen.getByTestId("session-location")).toBeInTheDocument();
      expect(screen.getAllByText("—")).toHaveLength(2);
    });

    it("shows the coordinates it has", () => {
      query.data = state({
        locationEnabled: true,
        sessions: [closed({ startLatitude: 50.0755, startLongitude: 14.4378, startAccuracy: 9 })],
      });
      renderWithClient(<MyAttendanceScreen />);

      expect(screen.getByText("50.0755, 14.4378 ±9 m")).toBeInTheDocument();
    });

    it("keeps showing a fix taken before the organization switched location off", () => {
      query.data = state({
        sessions: [closed({ endLatitude: 50.09, endLongitude: 14.45, endAccuracy: 20 })],
      });
      renderWithClient(<MyAttendanceScreen />);

      expect(screen.getByText("50.0900, 14.4500 ±20 m")).toBeInTheDocument();
    });
  });

  describe("a day the sweep closed", () => {
    const swept = (overrides = {}) => ({
      id: "session-1",
      businessDate: "2026-09-11",
      startedAt: "2026-09-11T06:00:00Z",
      endedAt: "2026-09-11T22:00:00Z",
      timezone: ZONE,
      closedBy: "SWEEP" as const,
      ...NO_SESSION_LOCATION,
      open: false,
      breaks: [],
      ...overrides,
    });

    it("flags the session", () => {
      query.data = state({ sessions: [swept()] });
      renderWithClient(<MyAttendanceScreen />);

      expect(screen.getByText("Auto-closed")).toBeInTheDocument();
    });

    it("leaves an ordinary day unflagged", () => {
      query.data = state({ sessions: [swept({ closedBy: "USER" as const })] });
      renderWithClient(<MyAttendanceScreen />);

      expect(screen.queryByText("Auto-closed")).not.toBeInTheDocument();
    });

    it("flags the break stretch rather than the session when that is what was closed", () => {
      query.data = state({
        sessions: [
          swept({
            closedBy: "USER" as const,
            breaks: [
              {
                id: "break-1",
                sessionId: "session-1",
                startedAt: "2026-09-11T10:00:00Z",
                endedAt: "2026-09-11T12:00:00Z",
                autoClosed: true,
                open: false,
              },
            ],
          }),
        ],
      });
      renderWithClient(<MyAttendanceScreen />);

      // On the break's own row: 12:00 – 14:00 in Prague, two hours of it.
      const flag = screen.getByText("Auto-closed");
      expect(flag.closest("li")).toHaveTextContent("12:00 – 14:00");
      expect(screen.queryByText("Break")).toBeInTheDocument();
    });
  });
});
