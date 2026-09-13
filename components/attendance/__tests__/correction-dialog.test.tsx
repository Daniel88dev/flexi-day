import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NO_SESSION_LOCATION, renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import type {
  AttendanceDaySessions,
  AttendanceEvent,
  AttendanceSession,
} from "@/lib/api/attendance";
import { CorrectionDialog } from "../correction-dialog";

const ZONE = "Europe/Prague";

const day = {
  data: undefined as AttendanceDaySessions | undefined,
  isPending: false,
  error: null as Error | null,
};
const events = { data: undefined as AttendanceEvent[] | undefined, isPending: false, error: null };

const correctSession = { mutateAsync: vi.fn(), isPending: false };
const correctBreak = { mutateAsync: vi.fn(), isPending: false };
const removeBreak = { mutateAsync: vi.fn(), isPending: false };
const removeSession = { mutateAsync: vi.fn(), isPending: false };

vi.mock("@/lib/api/queries", () => ({
  useAttendanceDay: () => day,
  useSessionEvents: () => events,
  useCorrectSession: () => correctSession,
  useCorrectBreak: () => correctBreak,
  useRemoveBreak: () => removeBreak,
  useRemoveSession: () => removeSession,
}));

const session = (overrides: Partial<AttendanceSession> = {}): AttendanceSession => ({
  id: "session-1",
  businessDate: "2026-09-09",
  // 08:05 to 17:10 in Prague.
  startedAt: "2026-09-09T06:05:00.000Z",
  endedAt: "2026-09-09T15:10:00.000Z",
  timezone: ZONE,
  closedBy: "USER",
  open: false,
  ...NO_SESSION_LOCATION,
  breaks: [],
  ...overrides,
});

const withBreak = () =>
  session({
    breaks: [
      {
        id: "break-1",
        sessionId: "session-1",
        startedAt: "2026-09-09T10:00:00.000Z",
        endedAt: "2026-09-09T10:30:00.000Z",
        autoClosed: false,
        open: false,
      },
    ],
  });

const answer = (sessions: AttendanceSession[]): AttendanceDaySessions => ({
  organizationId: "org-1",
  employmentId: "emp-1",
  userId: "user-1",
  businessDate: "2026-09-09",
  timezone: ZONE,
  sessions,
});

const open = (props: Partial<React.ComponentProps<typeof CorrectionDialog>> = {}) =>
  renderWithClient(
    <CorrectionDialog
      organizationId="org-1"
      businessDate="2026-09-09"
      open
      onOpenChange={vi.fn()}
      {...props}
    />
  );

describe("CorrectionDialog", () => {
  beforeEach(() => {
    day.data = answer([session()]);
    day.isPending = false;
    day.error = null;
    events.data = [];
    events.isPending = false;
    for (const mutation of [correctSession, correctBreak, removeBreak, removeSession]) {
      mutation.mutateAsync.mockReset();
      mutation.mutateAsync.mockResolvedValue(session());
      mutation.isPending = false;
    }
  });

  it("opens on the times as the organization recorded them", () => {
    open();

    expect(screen.getByLabelText("Clock in")).toHaveValue("08:05");
    expect(screen.getByLabelText("Clock out")).toHaveValue("17:10");
  });

  it("carries the self-service window message on the reader's own day", () => {
    open();

    expect(screen.getByText(/correct today's session yourself/i)).toBeInTheDocument();
  });

  it("names the person instead when an admin opened somebody else's", () => {
    open({ userId: "user-2", personName: "Noah Weber" });

    expect(screen.getByText("Noah Weber")).toBeInTheDocument();
    expect(screen.queryByText(/correct today's session yourself/i)).not.toBeInTheDocument();
  });

  it("refuses a clock-out before its clock-in and saves nothing", async () => {
    const user = userEvent.setup();
    open();

    await user.clear(screen.getByLabelText("Clock out"));
    await user.type(screen.getByLabelText("Clock out"), "08:05");

    expect(screen.getByText("Has to end after it starts.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save correction" })).toBeDisabled();
    expect(correctSession.mutateAsync).not.toHaveBeenCalled();
  });

  it("refuses a break outside its session", async () => {
    const user = userEvent.setup();
    day.data = answer([withBreak()]);
    open();

    // Before the clock-in rather than after the clock-out, so it is the
    // containment rule that refuses it and not the order of its own two ends.
    const [start] = screen.getAllByLabelText("Breaks");
    await user.clear(start!);
    await user.type(start!, "07:00");

    expect(screen.getByText("Has to stay inside the session.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save correction" })).toBeDisabled();
  });

  it("sends only the end that moved", async () => {
    const user = userEvent.setup();
    open();

    await user.clear(screen.getByLabelText("Clock out"));
    await user.type(screen.getByLabelText("Clock out"), "17:30");
    await user.click(screen.getByRole("button", { name: "Save correction" }));

    await waitFor(() => {
      expect(correctSession.mutateAsync).toHaveBeenCalledWith({
        sessionId: "session-1",
        patch: { endedAt: "2026-09-09T15:30:00.000Z" },
      });
    });
    expect(correctBreak.mutateAsync).not.toHaveBeenCalled();
  });

  it("removes a break on its own", async () => {
    const user = userEvent.setup();
    day.data = answer([withBreak()]);
    open();

    await user.click(screen.getByRole("button", { name: "Remove break" }));

    await waitFor(() => {
      expect(removeBreak.mutateAsync).toHaveBeenCalledWith("break-1");
    });
  });

  it("asks before deleting a session", async () => {
    const user = userEvent.setup();
    open();

    await user.click(screen.getByRole("button", { name: "Delete session" }));
    expect(screen.getByText(/its history stays/i)).toBeInTheDocument();
    expect(removeSession.mutateAsync).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Delete session" }));
    await waitFor(() => {
      expect(removeSession.mutateAsync).toHaveBeenCalledWith("session-1");
    });
  });

  it("renders the timeline with the actor behind each entry", () => {
    events.data = [
      {
        id: "event-1",
        sessionId: "session-1",
        eventType: "CLOCK_IN",
        user: { id: "user-1", name: "Noah Weber", initials: "NW", avatarColor: "#000" },
        before: null,
        after: null,
        createdAt: "2026-09-09T06:05:00.000Z",
      },
      {
        id: "event-2",
        sessionId: "session-1",
        eventType: "SESSION_EDITED",
        user: null,
        before: null,
        after: null,
        createdAt: "2026-09-09T22:05:00.000Z",
      },
    ];
    open();

    const timeline = screen.getByTestId("correction-history");
    expect(timeline).toHaveTextContent("Clocked in. Noah Weber");
    // A null actor is the sweep, and reads as the system rather than as nobody.
    expect(timeline).toHaveTextContent("Times corrected. System");
  });

  it("says so when the day holds nothing to correct", () => {
    day.data = answer([]);
    open();

    expect(screen.getByText("Nothing was recorded on this day.")).toBeInTheDocument();
  });

  it("tells an employee to ask an admin when the day is refused", () => {
    day.data = undefined;
    day.error = new ApiError(403, "No permission for this employment");
    open();

    expect(screen.getByText(/only an admin can change a day this old/i)).toBeInTheDocument();
  });
});
