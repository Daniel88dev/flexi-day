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
const addBreak = { mutateAsync: vi.fn(), isPending: false };
const markChecked = { mutateAsync: vi.fn(), isPending: false };

vi.mock("@/lib/api/queries", () => ({
  useAttendanceDay: () => day,
  useSessionEvents: () => events,
  useCorrectSession: () => correctSession,
  useCorrectBreak: () => correctBreak,
  useRemoveBreak: () => removeBreak,
  useRemoveSession: () => removeSession,
  useAddBreak: () => addBreak,
  useMarkSessionChecked: () => markChecked,
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
    for (const mutation of [
      correctSession,
      correctBreak,
      removeBreak,
      removeSession,
      addBreak,
      markChecked,
    ]) {
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

  it("tells the reader until when their own day stays theirs to change", () => {
    open({ ownDay: { today: "2026-09-10", selfService: { enabled: true, days: 7 } } });

    expect(
      screen.getByText("Your own day. You can change it until Wednesday, September 16.")
    ).toBeInTheDocument();
  });

  it("says until midnight when the window closes on the day itself", () => {
    open({
      businessDate: "2026-09-09",
      ownDay: { today: "2026-09-09", selfService: { enabled: true, days: 0 } },
    });

    expect(screen.getByText("Your own day. You can change it until midnight.")).toBeInTheDocument();
  });

  it("names the person instead when an admin opened somebody else's", () => {
    open({ userId: "user-2", personName: "Noah Weber" });

    expect(screen.getByText("Noah Weber")).toBeInTheDocument();
    expect(screen.queryByText(/your own day/i)).not.toBeInTheDocument();
  });

  it("leaves out a closed session outside the window while offering an open one", () => {
    day.data = answer([
      session({ id: "closed" }),
      session({
        id: "open",
        startedAt: "2026-09-09T16:00:00.000Z",
        endedAt: null,
        closedBy: null,
        open: true,
      }),
    ]);
    open({ ownDay: { today: "2026-09-10", selfService: { enabled: true, days: 0 } } });

    expect(screen.getByTestId("correction-session-open")).toBeInTheDocument();
    expect(screen.queryByTestId("correction-session-closed")).not.toBeInTheDocument();
  });

  it("offers every session to an admin", () => {
    day.data = answer([session({ id: "closed" }), session({ id: "other" })]);
    open({ userId: "user-2", personName: "Noah Weber" });

    expect(screen.getByTestId("correction-session-closed")).toBeInTheDocument();
    expect(screen.getByTestId("correction-session-other")).toBeInTheDocument();
  });

  describe("the delete rule on the reader's own day", () => {
    it("hides delete on a clocked session from an earlier day, and says why", () => {
      open({ ownDay: { today: "2026-09-10", selfService: { enabled: true, days: 7 } } });

      expect(screen.queryByRole("button", { name: "Delete session" })).not.toBeInTheDocument();
      expect(
        screen.getByText("Clocked on an earlier day, so it can be corrected but not deleted.")
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save correction" })).toBeInTheDocument();
    });

    it("keeps delete on a session dated today", () => {
      open({ ownDay: { today: "2026-09-09", selfService: { enabled: true, days: 7 } } });

      expect(screen.getByRole("button", { name: "Delete session" })).toBeInTheDocument();
    });

    it("keeps delete for an admin on any day", () => {
      open({ userId: "user-2", personName: "Noah Weber" });

      expect(screen.getByRole("button", { name: "Delete session" })).toBeInTheDocument();
    });
  });

  it("says an admin's entry is theirs to delete when the API refuses the reader", async () => {
    day.data = answer([session({ origin: "ENTERED", enteredByUserId: "user-1" })]);
    removeSession.mutateAsync.mockRejectedValue(
      new ApiError(403, "server wording", undefined, [
        { message: "server wording", context: { reason: "SELF_SERVICE_DELETE_ENTERED" } },
      ])
    );
    open({ ownDay: { today: "2026-09-10", selfService: { enabled: true, days: 7 } } });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Delete session" }));
    await user.click(screen.getByRole("button", { name: "Delete session" }));

    expect(
      await screen.findByText(
        "An admin entered this session. You can correct its times, but only an admin can delete it."
      )
    ).toBeInTheDocument();
  });

  describe("refusals from the API", () => {
    const refuse = (reason: string) =>
      correctSession.mutateAsync.mockRejectedValue(
        new ApiError(403, "server wording", undefined, [
          { message: "server wording", context: { reason } },
        ])
      );

    const saveMovedEnd = async () => {
      const user = userEvent.setup();
      await user.clear(screen.getByLabelText("Clock out"));
      await user.type(screen.getByLabelText("Clock out"), "17:30");
      await user.click(screen.getByRole("button", { name: "Save correction" }));
    };

    it("says corrections go through an admin when self-service is off", async () => {
      refuse("SELF_SERVICE_OFF");
      open({ ownDay: { today: "2026-09-09", selfService: { enabled: true, days: 0 } } });

      await saveMovedEnd();

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Your organization manages attendance corrections through an admin. Ask a group admin, or an organization admin."
      );
    });

    it("says the employment has ended", async () => {
      refuse("EMPLOYMENT_ENDED");
      open({ ownDay: { today: "2026-09-09", selfService: { enabled: true, days: 0 } } });

      await saveMovedEnd();

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Your employment here has ended. Your attendance stays readable, and only an admin can change it."
      );
    });

    it("says a clocked session from an earlier day can be corrected but not deleted", async () => {
      removeSession.mutateAsync.mockRejectedValue(
        new ApiError(403, "server wording", undefined, [
          { message: "server wording", context: { reason: "SELF_SERVICE_DELETE" } },
        ])
      );
      const user = userEvent.setup();
      // A stale tab: it still thought the session was today's.
      open({ ownDay: { today: "2026-09-09", selfService: { enabled: true, days: 0 } } });

      await user.click(screen.getByRole("button", { name: "Delete session" }));
      await user.click(screen.getByRole("button", { name: "Delete session" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "This session was clocked on an earlier day. You can correct its times, but only an admin can delete it."
      );
    });
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

    expect(screen.getByText("Has to stay inside the session, 08:05 to 17:10.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save correction" })).toBeDisabled();
  });

  describe("adding a break", () => {
    const typeNewBreak = async (
      user: ReturnType<typeof userEvent.setup>,
      from: string,
      to: string
    ) => {
      await user.click(screen.getByRole("button", { name: "Add break" }));
      const starts = screen.getAllByLabelText("Breaks");
      const ends = screen.getAllByLabelText("to");
      await user.type(starts[starts.length - 1]!, from);
      await user.type(ends[ends.length - 1]!, to);
    };

    it("saves a forgotten break on a closed session through the add endpoint", async () => {
      const user = userEvent.setup();
      day.data = answer([withBreak()]);
      open();

      await typeNewBreak(user, "15:00", "15:20");
      expect(screen.getByText("New")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Save correction" }));

      await waitFor(() => {
        expect(addBreak.mutateAsync).toHaveBeenCalledWith({
          sessionId: "session-1",
          span: { startedAt: "2026-09-09T13:00:00.000Z", endedAt: "2026-09-09T13:20:00.000Z" },
        });
      });
      expect(correctBreak.mutateAsync).not.toHaveBeenCalled();
      expect(correctSession.mutateAsync).not.toHaveBeenCalled();
    });

    it("is not offered on a session still running", () => {
      day.data = answer([session({ endedAt: null, closedBy: null, open: true })]);
      open();

      expect(screen.queryByRole("button", { name: "Add break" })).not.toBeInTheDocument();
    });

    it("refuses a new break over another, naming the one it runs into", async () => {
      const user = userEvent.setup();
      day.data = answer([withBreak()]);
      open();

      await typeNewBreak(user, "12:20", "12:45");

      expect(screen.getByText("Overlaps the break from 12:00 to 12:30.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save correction" })).toBeDisabled();
    });

    it("refuses a new break that ends before it starts", async () => {
      const user = userEvent.setup();
      open();

      await typeNewBreak(user, "15:20", "15:00");

      expect(screen.getByText("Has to end after it starts.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save correction" })).toBeDisabled();
    });

    it("asks for a time on a new break left empty", async () => {
      const user = userEvent.setup();
      open();

      await user.click(screen.getByRole("button", { name: "Add break" }));

      expect(screen.getByText("Needs a time.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save correction" })).toBeDisabled();
    });

    it("takes a new break back off the form without calling the API", async () => {
      const user = userEvent.setup();
      open();

      await user.click(screen.getByRole("button", { name: "Add break" }));
      await user.click(screen.getByRole("button", { name: "Remove break" }));

      expect(screen.queryByText("New")).not.toBeInTheDocument();
      expect(screen.getByText("No breaks recorded.")).toBeInTheDocument();
      expect(removeBreak.mutateAsync).not.toHaveBeenCalled();
    });

    it("sends only what did not land when the reader retries after a partial save", async () => {
      const user = userEvent.setup();
      const saved = session({
        breaks: [
          {
            id: "server-1",
            sessionId: "session-1",
            startedAt: "2026-09-09T13:00:00.000Z",
            endedAt: "2026-09-09T13:20:00.000Z",
            autoClosed: false,
            open: false,
          },
        ],
      });
      addBreak.mutateAsync
        .mockResolvedValueOnce(saved)
        .mockRejectedValueOnce(
          new ApiError(422, "server wording", undefined, [
            { message: "server wording", context: { reason: "PLAN_LIMIT" } },
          ])
        );
      open();

      await typeNewBreak(user, "15:00", "15:20");
      await typeNewBreak(user, "16:00", "16:10");
      await user.click(screen.getByRole("button", { name: "Save correction" }));

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      // The first one landed, so it reads as recorded rather than new.
      expect(screen.getAllByText("New")).toHaveLength(1);

      addBreak.mutateAsync.mockClear();
      addBreak.mutateAsync.mockResolvedValue(saved);
      await user.click(screen.getByRole("button", { name: "Save correction" }));

      await waitFor(() => expect(addBreak.mutateAsync).toHaveBeenCalledTimes(1));
      expect(addBreak.mutateAsync).toHaveBeenCalledWith({
        sessionId: "session-1",
        span: { startedAt: "2026-09-09T14:00:00.000Z", endedAt: "2026-09-09T14:10:00.000Z" },
      });
    });

    it("says why when the API refuses an overlap the form could not see", async () => {
      const user = userEvent.setup();
      addBreak.mutateAsync.mockRejectedValue(
        new ApiError(409, "server wording", undefined, [
          { message: "server wording", context: { reason: "BREAK_OVERLAPS" } },
        ])
      );
      open();

      await typeNewBreak(user, "15:00", "15:20");
      await user.click(screen.getByRole("button", { name: "Save correction" }));

      expect(
        await screen.findByText("Another break already covers that time.")
      ).toBeInTheDocument();
    });
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

  it("names who added a break afterwards, with its times", () => {
    events.data = [
      {
        id: "event-added",
        sessionId: "session-1",
        eventType: "BREAK_ADDED",
        user: { id: "user-1", name: "Noah Weber", initials: "NW", avatarColor: "#000" },
        before: null,
        after: {
          breakId: "break-2",
          startedAt: "2026-09-09T13:00:00.000Z",
          endedAt: "2026-09-09T13:20:00.000Z",
        },
        createdAt: "2026-09-10T06:52:00.000Z",
      },
    ];
    open();

    expect(screen.getByTestId("correction-history")).toHaveTextContent(
      "Break added, 15:00 to 15:20. Noah Weber"
    );
  });

  describe("an entered session", () => {
    const created = (by: { id: string; name: string }): AttendanceEvent => ({
      id: "event-created",
      sessionId: "session-1",
      eventType: "SESSION_CREATED",
      user: { ...by, initials: "XX", avatarColor: "#000" },
      before: null,
      after: {
        businessDate: "2026-09-09",
        startedAt: "2026-09-09T06:05:00.000Z",
        endedAt: "2026-09-09T15:10:00.000Z",
        origin: "ENTERED",
      },
      createdAt: "2026-09-10T06:52:00.000Z",
    });

    beforeEach(() => {
      day.data = answer([session({ origin: "ENTERED" })]);
    });

    it("carries the mark with who entered it, and the entry at the head of its history", () => {
      events.data = [created({ id: "dana", name: "Dana Holt" })];
      open({ userId: "user-1", personName: "Noah Weber" });

      expect(screen.getByText("Entered by Dana Holt")).toBeInTheDocument();
      expect(screen.getByLabelText("Start")).toHaveValue("08:05");
      expect(screen.getByLabelText("End")).toHaveValue("17:10");
      expect(screen.getByTestId("correction-history")).toHaveTextContent(
        "Session entered, 08:05 to 17:10. Dana Holt"
      );
    });

    it("stamps each history entry with its date, since an entry can come days later", () => {
      events.data = [created({ id: "dana", name: "Dana Holt" })];
      open();

      expect(screen.getByTestId("correction-history")).toHaveTextContent("Thu, Sep 10 08:52");
    });

    it("lets the reader delete one they entered themselves on an earlier day", () => {
      day.data = answer([session({ origin: "ENTERED", enteredByUserId: "user-1" })]);
      open({ ownDay: { today: "2026-09-10", selfService: { enabled: true, days: 7 } } });

      expect(screen.getByRole("button", { name: "Delete session" })).toBeInTheDocument();
      expect(
        screen.getByText("You entered this session, so you can delete it. Its history stays.")
      ).toBeInTheDocument();
    });

    it("keeps delete from the reader when an admin entered it for them today", () => {
      day.data = answer([session({ origin: "ENTERED", enteredByUserId: "dana" })]);
      open({ ownDay: { today: "2026-09-09", selfService: { enabled: true, days: 7 } } });

      expect(screen.queryByRole("button", { name: "Delete session" })).not.toBeInTheDocument();
      expect(
        screen.getByText("Entered by an admin, so it can be corrected but not deleted.")
      ).toBeInTheDocument();
    });

    it("keeps delete from the reader when an admin entered it for them", () => {
      day.data = answer([session({ origin: "ENTERED", enteredByUserId: "dana" })]);
      open({ ownDay: { today: "2026-09-10", selfService: { enabled: true, days: 7 } } });

      expect(screen.queryByRole("button", { name: "Delete session" })).not.toBeInTheDocument();
      expect(
        screen.getByText("Entered by an admin, so it can be corrected but not deleted.")
      ).toBeInTheDocument();
    });
  });

  describe("a session changed after its day", () => {
    beforeEach(() => {
      day.data = answer([session({ changedAfterDay: true })]);
    });

    it("tells the admin who changed it, and offers to mark it checked", async () => {
      const onOpenChange = vi.fn();
      open({ userId: "user-1", personName: "Noah Weber", onOpenChange });

      expect(screen.getByText("Changed by Noah Weber after the day")).toBeInTheDocument();
      expect(
        screen.getByText(/Noah Weber changed this session after its day\./)
      ).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "Mark as checked" }));

      expect(markChecked.mutateAsync).toHaveBeenCalledWith("session-1");
      expect(correctSession.mutateAsync).not.toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("says why when the API refuses to mark it", async () => {
      markChecked.mutateAsync.mockRejectedValue(
        new ApiError(409, "server wording", undefined, [
          { message: "server wording", context: { reason: "SESSION_NOT_CHANGED" } },
        ])
      );
      open({ userId: "user-1", personName: "Noah Weber" });

      await userEvent.click(screen.getByRole("button", { name: "Mark as checked" }));

      expect(
        await screen.findByText("This session has no change after its day to check.")
      ).toBeInTheDocument();
    });

    it("holds mark as checked back while the form carries an unsaved edit", async () => {
      const user = userEvent.setup();
      open({ userId: "user-1", personName: "Noah Weber" });

      await user.clear(screen.getByLabelText("Clock out"));
      await user.type(screen.getByLabelText("Clock out"), "17:30");

      expect(screen.getByRole("button", { name: "Mark as checked" })).toBeDisabled();
      expect(
        screen.getByText("Save or undo your changes before marking the session as checked.")
      ).toBeInTheDocument();

      await user.clear(screen.getByLabelText("Clock out"));
      await user.type(screen.getByLabelText("Clock out"), "17:10");

      expect(screen.getByRole("button", { name: "Mark as checked" })).toBeEnabled();
    });

    it("offers no mark as checked on a session nobody changed after its day", () => {
      day.data = answer([session()]);
      open({ userId: "user-1", personName: "Noah Weber" });

      expect(screen.queryByRole("button", { name: "Mark as checked" })).not.toBeInTheDocument();
      expect(screen.queryByText(/after the day/)).not.toBeInTheDocument();
    });

    it("never offers the employee to mark their own change checked", () => {
      open({ ownDay: { today: "2026-09-10", selfService: { enabled: true, days: 7 } } });

      expect(screen.queryByRole("button", { name: "Mark as checked" })).not.toBeInTheDocument();
      expect(screen.getByText("Changed after the day")).toBeInTheDocument();
    });

    it("names the admin who marked it checked in the timeline", () => {
      events.data = [
        {
          id: "event-checked",
          sessionId: "session-1",
          eventType: "SESSION_CHECKED",
          user: { id: "owner", name: "Olivia Owner", initials: "OO", avatarColor: "#000" },
          before: { changedAfterDay: true },
          after: { changedAfterDay: false },
          createdAt: "2026-09-11T07:00:00.000Z",
        },
      ];
      open({ userId: "user-1", personName: "Noah Weber" });

      expect(screen.getByTestId("correction-history")).toHaveTextContent(
        "Marked as checked. Olivia Owner"
      );
    });
  });

  describe("the employee's own past day", () => {
    const warning =
      "This day has passed. Once you save, your admin sees the session marked as changed after the day until they check it.";

    it("warns before saving that the admin will see the change flagged", () => {
      open({ ownDay: { today: "2026-09-10", selfService: { enabled: true, days: 7 } } });

      expect(screen.getByText(warning)).toBeInTheDocument();
    });

    it("says nothing to an admin correcting their own past day, which is never flagged", () => {
      open({
        ownDay: {
          today: "2026-09-10",
          selfService: { enabled: true, days: 7 },
          administersOwn: true,
        },
      });

      expect(screen.queryByText(warning)).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save correction" })).toBeInTheDocument();
    });

    it("says nothing on today's session, or to an admin", () => {
      const { unmount } = open({
        ownDay: { today: "2026-09-09", selfService: { enabled: true, days: 7 } },
      });
      expect(screen.queryByText(warning)).not.toBeInTheDocument();
      unmount();

      open({ userId: "user-1", personName: "Noah Weber" });
      expect(screen.queryByText(warning)).not.toBeInTheDocument();
    });
  });

  it("offers another session on the day when the screen allows one", async () => {
    const onAddSession = vi.fn();
    open({ onAddSession });

    await userEvent.setup().click(screen.getByRole("button", { name: "Add another session" }));

    expect(onAddSession).toHaveBeenCalled();
  });

  it("offers no other session when the screen does not allow one", () => {
    open();

    expect(screen.queryByRole("button", { name: "Add another session" })).not.toBeInTheDocument();
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
