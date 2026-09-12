import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import type { AttendanceBreak, AttendanceSession, AttendanceState } from "@/lib/api/attendance";
import { ClockWidget } from "../clock-widget";

const clockIn = { mutate: vi.fn(), isPending: false, error: null as unknown };
const clockOut = { mutate: vi.fn(), isPending: false, error: null as unknown };
const startBreak = { mutate: vi.fn(), isPending: false, error: null as unknown };
const endBreak = { mutate: vi.fn(), isPending: false, error: null as unknown };

const query = { data: undefined as AttendanceState | undefined, isPending: false };

vi.mock("@/lib/api/queries", () => ({
  useAttendanceState: () => query,
  useClockIn: () => clockIn,
  useClockOut: () => clockOut,
  useStartBreak: () => startBreak,
  useEndBreak: () => endBreak,
}));

const ZONE = "Europe/Prague";

const openSession = (startedAt = "2026-09-11T06:42:00Z", breaks: AttendanceBreak[] = []) =>
  ({
    id: "session-1",
    businessDate: "2026-09-11",
    startedAt,
    endedAt: null,
    timezone: ZONE,
    closedBy: null,
    open: true,
    breaks,
  }) satisfies AttendanceSession;

const openBreak = (startedAt = "2026-09-11T10:05:00Z") =>
  ({
    id: "break-1",
    sessionId: "session-1",
    startedAt,
    endedAt: null,
    autoClosed: false,
    open: true,
  }) satisfies AttendanceBreak;

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

describe("ClockWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const mutation of [clockIn, clockOut, startBreak, endBreak]) {
      mutation.error = null;
      mutation.isPending = false;
    }
    query.data = state();
    query.isPending = false;
  });

  it("offers only Clock in while the person is out", () => {
    renderWithClient(<ClockWidget />);

    expect(screen.getByText("Not clocked in")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clock in" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clock out" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Take a break" })).toBeNull();
  });

  it("offers a break and a clock-out while clocked in, with the time it started", () => {
    query.data = state({ openSession: openSession() });
    renderWithClient(<ClockWidget />);

    expect(screen.getByText("Clocked in")).toBeInTheDocument();
    expect(screen.getByText("since 08:42")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Take a break" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clock out" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clock in" })).toBeNull();
  });

  it("offers ending the break and clocking out while on one", () => {
    query.data = state({
      openSession: openSession("2026-09-11T06:42:00Z", [openBreak()]),
      openBreak: openBreak(),
    });
    renderWithClient(<ClockWidget />);

    expect(screen.getByText("On break")).toBeInTheDocument();
    expect(screen.getByText("since 12:05")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "End break" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clock out" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Take a break" })).toBeNull();
  });

  it("explains an inactive organization and offers no clock at all", () => {
    query.data = state({ active: false });
    renderWithClient(<ClockWidget />);

    expect(screen.getByText("Clocking in is off")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clock in" })).toBeNull();
    expect(screen.getByRole("link", { name: "View my attendance" })).toHaveAttribute(
      "href",
      "/my-attendance"
    );
  });

  it("renders a 409 for an open session as clocked in since, with a clock-out and no clock-in", () => {
    // The state read has not caught up yet — which is the whole point: the
    // notice must not leave a Clock in button under it.
    query.data = state({ openSession: null });
    clockIn.error = new ApiError(409, "You are already clocked in", undefined, [
      {
        message: "You are already clocked in",
        context: {
          reason: "SESSION_ALREADY_OPEN",
          sessionId: "session-1",
          startedAt: "2026-09-11T06:42:00Z",
        },
      },
    ]);
    renderWithClient(<ClockWidget />);

    expect(screen.getByText("Clocked in since 08:42")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clock out" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clock in" })).toBeNull();
  });

  it("clocks out from the notice's own action", () => {
    query.data = state({ openSession: null });
    clockIn.error = new ApiError(409, "You are already clocked in", undefined, [
      {
        message: "You are already clocked in",
        context: { reason: "SESSION_ALREADY_OPEN", startedAt: "2026-09-11T06:42:00Z" },
      },
    ]);
    renderWithClient(<ClockWidget />);

    fireEvent.click(screen.getByRole("button", { name: "Clock out" }));

    expect(clockOut.mutate).toHaveBeenCalledTimes(1);
  });

  it("reads back the other conflicts rather than a bare failure", () => {
    clockOut.error = new ApiError(409, "You are not clocked in", undefined, [
      { message: "You are not clocked in", context: { reason: "NO_OPEN_SESSION" } },
    ]);
    renderWithClient(<ClockWidget />);

    expect(screen.getByText("You are not clocked in.")).toBeInTheDocument();
  });

  it("sends the clock-in on click", () => {
    renderWithClient(<ClockWidget />);

    fireEvent.click(screen.getByRole("button", { name: "Clock in" }));

    expect(clockIn.mutate).toHaveBeenCalledTimes(1);
  });

  it("disables every action while one write is in flight", () => {
    query.data = state({ openSession: openSession() });
    startBreak.isPending = true;
    renderWithClient(<ClockWidget />);

    expect(screen.getByRole("button", { name: "Clock out" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Take a break" })).toBeDisabled();
  });

  it("totals the day's presence and breaks", () => {
    query.data = state({
      sessions: [
        {
          ...openSession("2026-09-11T06:00:00Z"),
          endedAt: "2026-09-11T10:00:00Z",
          open: false,
          closedBy: "USER",
          breaks: [
            {
              id: "break-1",
              sessionId: "session-1",
              startedAt: "2026-09-11T08:00:00Z",
              endedAt: "2026-09-11T08:30:00Z",
              autoClosed: false,
              open: false,
            },
          ],
        },
      ],
    });
    renderWithClient(<ClockWidget />);

    expect(screen.getByText("4:00")).toBeInTheDocument();
    expect(screen.getByText("0:30")).toBeInTheDocument();
  });

  it("says so while the clock is still loading", () => {
    query.data = undefined;
    query.isPending = true;
    renderWithClient(<ClockWidget />);

    expect(screen.getByText("Loading your clock…")).toBeInTheDocument();
  });

  it("says so for a viewer with no Employment to clock against", () => {
    query.data = undefined;
    query.isPending = false;
    renderWithClient(<ClockWidget />);

    expect(screen.getByText("Your clock is unavailable right now.")).toBeInTheDocument();
  });

  it("drops the attendance link on the page that link goes to", () => {
    renderWithClient(<ClockWidget showAttendanceLink={false} />);

    expect(screen.queryByRole("link", { name: "View my attendance" })).toBeNull();
  });
});
