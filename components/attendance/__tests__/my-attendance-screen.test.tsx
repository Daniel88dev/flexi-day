import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithClient } from "@/lib/test-utils";
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
          open: true,
          breaks: [],
        },
      ],
    });
    renderWithClient(<MyAttendanceScreen />);

    expect(screen.getByText(/Still open/)).toBeInTheDocument();
  });
});
