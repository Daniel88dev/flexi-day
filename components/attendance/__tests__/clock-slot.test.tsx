import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { NO_SESSION_LOCATION, renderWithClient } from "@/lib/test-utils";
import type { AttendanceState } from "@/lib/api/attendance";
import { ClockSlot } from "../clock-slot";

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

describe("ClockSlot", () => {
  beforeEach(() => {
    query.data = state();
    query.isPending = false;
  });

  it("renders nothing to press for a viewer with no Employment", () => {
    query.data = undefined;
    renderWithClient(<ClockSlot />);

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("opens the widget as a sheet", () => {
    renderWithClient(<ClockSlot />);

    fireEvent.click(screen.getByRole("button", { name: "Clock" }));

    expect(screen.getByRole("button", { name: "Clock in" })).toBeInTheDocument();
  });

  it("labels the disc On break while one is running", () => {
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
      openBreak: {
        id: "break-1",
        sessionId: "session-1",
        startedAt: "2026-09-11T10:00:00Z",
        endedAt: null,
        autoClosed: false,
        open: true,
      },
    });
    renderWithClient(<ClockSlot />);

    expect(screen.getByRole("button", { name: "Clock" })).toHaveTextContent("On break");
  });
});
