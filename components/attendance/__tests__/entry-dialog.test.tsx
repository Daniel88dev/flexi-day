import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NO_SESSION_LOCATION, renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import type { AttendanceDaySessions, AttendanceSession } from "@/lib/api/attendance";
import { EntryDialog } from "../entry-dialog";

const ZONE = "Europe/Prague";

const day = { data: undefined as AttendanceDaySessions | undefined, isPending: false };
const enterSession = { mutateAsync: vi.fn(), isPending: false };

vi.mock("@/lib/api/queries", () => ({
  useAttendanceDay: () => day,
  useEnterSession: () => enterSession,
}));

const session = (overrides: Partial<AttendanceSession> = {}): AttendanceSession => ({
  id: "session-1",
  businessDate: "2026-09-08",
  // 08:05 to 17:10 in Prague.
  startedAt: "2026-09-08T06:05:00.000Z",
  endedAt: "2026-09-08T15:10:00.000Z",
  timezone: ZONE,
  closedBy: "USER",
  origin: "CLOCKED",
  open: false,
  ...NO_SESSION_LOCATION,
  breaks: [],
  ...overrides,
});

const onOpenChange = vi.fn();

const own = (props: Partial<React.ComponentProps<typeof EntryDialog>> = {}) =>
  renderWithClient(
    <EntryDialog
      organizationId="org-1"
      businessDate="2026-09-08"
      today="2026-09-11"
      timezone={ZONE}
      selfService={{ enabled: true, days: 7 }}
      open
      onOpenChange={onOpenChange}
      {...props}
    />
  );

const forPerson = (spell?: { began: string | null; ended: string | null }) =>
  renderWithClient(
    <EntryDialog
      organizationId="org-1"
      businessDate="2026-08-31"
      today="2026-09-11"
      timezone={ZONE}
      person={{ userId: "user-tom", name: "Tom Becker", spell }}
      open
      onOpenChange={onOpenChange}
    />
  );

const fill = async (start: string, end: string) => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Start"), start);
  await user.type(screen.getByLabelText("End"), end);
  return user;
};

const submit = () => screen.getByRole("button", { name: "Add session" });

describe("EntryDialog", () => {
  beforeEach(() => {
    // Friday 11 September 2026, 12:19 in Prague. Only Date is faked, so the
    // user-event timers still run.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-11T10:19:00Z"));
    day.data = undefined;
    day.isPending = false;
    enterSession.mutateAsync.mockReset();
    enterSession.mutateAsync.mockResolvedValue(session({ origin: "ENTERED" }));
    onOpenChange.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("enters the reader's own day from the date they were looking at", async () => {
    own();

    expect(screen.getByLabelText("Date")).toHaveValue("2026-09-08");
    expect(screen.getByText("Today or up to 7 days back")).toBeInTheDocument();
    expect(
      screen.getByText("Marked as entered for good. Your admin sees it that way.")
    ).toBeInTheDocument();

    const user = await fill("08:10", "16:55");
    await user.click(submit());

    expect(enterSession.mutateAsync).toHaveBeenCalledWith({
      organizationId: "org-1",
      businessDate: "2026-09-08",
      startedAt: "2026-09-08T06:10:00.000Z",
      endedAt: "2026-09-08T14:55:00.000Z",
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("refuses an end before its start, and takes it as a night shift once switched", async () => {
    own();

    const user = await fill("22:00", "06:15");

    expect(
      screen.getByText(
        "Has to end after it starts. If it ran past midnight, switch on Ends the next day."
      )
    ).toBeInTheDocument();
    expect(submit()).toBeDisabled();

    await user.click(screen.getByRole("switch", { name: "Ends the next day" }));

    expect(
      screen.getByText("Ends Wednesday, September 9. It stays on Tuesday, the day it started.")
    ).toBeInTheDocument();
    await user.click(submit());
    expect(enterSession.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        businessDate: "2026-09-08",
        startedAt: "2026-09-08T20:00:00.000Z",
        endedAt: "2026-09-09T04:15:00.000Z",
      })
    );
  });

  it("refuses an end later than now", async () => {
    own({ businessDate: "2026-09-11" });

    await fill("13:00", "17:00");

    expect(
      screen.getByText(
        "Can't end later than now, 12:19. Still working? Clock in, then correct the start."
      )
    ).toBeInTheDocument();
    expect(submit()).toBeDisabled();
  });

  it("names the session of the day it would run over", async () => {
    day.data = {
      organizationId: "org-1",
      employmentId: "emp-1",
      userId: "user-1",
      businessDate: "2026-09-08",
      timezone: ZONE,
      sessions: [session()],
    };
    own();

    await fill("07:30", "12:00");

    expect(
      screen.getByText("Overlaps your session from 08:05 to 17:10 on this day.")
    ).toBeInTheDocument();
    expect(submit()).toBeDisabled();
  });

  it("keeps the reader's own date inside the window", () => {
    own();

    const date = screen.getByLabelText("Date");
    expect(date).toHaveAttribute("min", "2026-09-04");
    expect(date).toHaveAttribute("max", "2026-09-11");

    fireEvent.change(date, { target: { value: "2026-09-03" } });

    expect(screen.getByText("Only an admin can change a day this old.")).toBeInTheDocument();
  });

  it("gives an admin the person's version, with any day of their employment", async () => {
    forPerson();

    expect(
      screen.getByRole("heading", { name: "Add a session for Tom Becker" })
    ).toBeInTheDocument();
    expect(screen.getByText("Any day of Tom Becker's employment")).toBeInTheDocument();
    expect(screen.getByLabelText("Date")).not.toHaveAttribute("min");

    const user = await fill("08:30", "17:00");
    await user.click(submit());

    expect(enterSession.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-tom", businessDate: "2026-08-31" })
    );
  });

  it("refuses a date the team read already puts outside the person's employment", async () => {
    forPerson({ began: "2026-09-01", ended: null });

    await fill("08:30", "17:00");

    expect(
      screen.getByText("Tom Becker's employment began on September 1. Pick a later day.")
    ).toBeInTheDocument();
    expect(submit()).toBeDisabled();
  });

  it("says in the reader's language why the API refused, the session limit included", async () => {
    enterSession.mutateAsync.mockRejectedValue(
      new ApiError(422, "server wording", undefined, [
        { message: "server wording", context: { reason: "OVER_CEILING", ceilingMinutes: 960 } },
      ])
    );
    forPerson();

    const user = await fill("08:30", "17:00");
    await user.click(submit());

    expect(
      await screen.findByText("Can't be longer than 16:00, your organization's session limit.")
    ).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
