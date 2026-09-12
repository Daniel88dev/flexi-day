import { describe, expect, it } from "vitest";
import type { AttendanceBreak, AttendanceSession } from "@/lib/api/attendance";
import { NO_SESSION_LOCATION } from "@/lib/test-utils";
import {
  breaksMinutes,
  buildTimeline,
  clockStateOf,
  formatClockTime,
  minutesBetween,
  presenceMinutes,
  spanMinutes,
} from "../today";

const ZONE = "Europe/Prague";
const NOW = new Date("2026-09-11T13:00:00Z");

const aBreak = (startedAt: string, endedAt: string | null = null): AttendanceBreak => ({
  id: `break-${startedAt}`,
  sessionId: "session-1",
  startedAt,
  endedAt,
  autoClosed: false,
  open: endedAt === null,
});

const aSession = (
  startedAt: string,
  endedAt: string | null = null,
  breaks: AttendanceBreak[] = []
): AttendanceSession => ({
  id: "session-1",
  businessDate: "2026-09-11",
  startedAt,
  endedAt,
  timezone: ZONE,
  closedBy: endedAt ? "USER" : null,
  ...NO_SESSION_LOCATION,
  open: endedAt === null,
  breaks,
});

describe("minutesBetween", () => {
  it("floors to whole minutes", () => {
    expect(minutesBetween("2026-09-11T08:00:00Z", "2026-09-11T08:01:59Z")).toBe(1);
  });

  it("returns 0 rather than a negative span", () => {
    expect(minutesBetween("2026-09-11T09:00:00Z", "2026-09-11T08:00:00Z")).toBe(0);
  });

  it("returns 0 for an unparseable instant", () => {
    expect(minutesBetween("not-a-date", NOW)).toBe(0);
  });
});

describe("spanMinutes", () => {
  it("measures a closed span between its own ends", () => {
    expect(
      spanMinutes({ startedAt: "2026-09-11T08:00:00Z", endedAt: "2026-09-11T09:30:00Z" }, NOW)
    ).toBe(90);
  });

  it("measures an open span up to now", () => {
    expect(spanMinutes({ startedAt: "2026-09-11T12:00:00Z", endedAt: null }, NOW)).toBe(60);
  });
});

describe("presenceMinutes", () => {
  it("adds every session of the day, breaks included", () => {
    const sessions = [
      aSession("2026-09-11T06:00:00Z", "2026-09-11T08:00:00Z"),
      aSession("2026-09-11T09:00:00Z", "2026-09-11T10:00:00Z"),
    ];
    expect(presenceMinutes(sessions, NOW)).toBe(180);
  });

  it("is 0 for a day with nothing recorded", () => {
    expect(presenceMinutes([], NOW)).toBe(0);
  });
});

describe("breaksMinutes", () => {
  it("adds the breaks across sessions and counts an open one to now", () => {
    const sessions = [
      aSession("2026-09-11T06:00:00Z", "2026-09-11T08:00:00Z", [
        aBreak("2026-09-11T07:00:00Z", "2026-09-11T07:20:00Z"),
      ]),
      aSession("2026-09-11T12:30:00Z", null, [aBreak("2026-09-11T12:50:00Z")]),
    ];
    expect(breaksMinutes(sessions, NOW)).toBe(30);
  });
});

describe("buildTimeline", () => {
  it("alternates work and break inside one closed session", () => {
    const session = aSession("2026-09-11T06:00:00Z", "2026-09-11T14:00:00Z", [
      aBreak("2026-09-11T10:00:00Z", "2026-09-11T10:30:00Z"),
    ]);

    expect(buildTimeline(session, NOW)).toEqual([
      {
        kind: "work",
        startedAt: "2026-09-11T06:00:00Z",
        endedAt: "2026-09-11T10:00:00Z",
        minutes: 240,
      },
      {
        kind: "break",
        startedAt: "2026-09-11T10:00:00Z",
        endedAt: "2026-09-11T10:30:00Z",
        minutes: 30,
      },
      {
        kind: "work",
        startedAt: "2026-09-11T10:30:00Z",
        endedAt: "2026-09-11T14:00:00Z",
        minutes: 210,
      },
    ]);
  });

  it("ends at the open break, which runs to the end of the session", () => {
    const session = aSession("2026-09-11T06:00:00Z", null, [aBreak("2026-09-11T12:00:00Z")]);

    const timeline = buildTimeline(session, NOW);
    expect(timeline).toHaveLength(2);
    expect(timeline[1]).toEqual({
      kind: "break",
      startedAt: "2026-09-11T12:00:00Z",
      endedAt: null,
      minutes: 60,
    });
  });

  it("drops a closed work stretch under a minute rather than rendering a 0:00 row", () => {
    const session = aSession("2026-09-11T06:00:00Z", "2026-09-11T08:00:00Z", [
      aBreak("2026-09-11T06:00:00Z", "2026-09-11T08:00:00Z"),
    ]);

    expect(buildTimeline(session, NOW).map((segment) => segment.kind)).toEqual(["break"]);
  });

  it("keeps the trailing work stretch open while the session is", () => {
    const session = aSession("2026-09-11T12:00:00Z", null);

    expect(buildTimeline(session, NOW)).toEqual([
      { kind: "work", startedAt: "2026-09-11T12:00:00Z", endedAt: null, minutes: 60 },
    ]);
  });

  it("orders the breaks by their start, whatever order they arrive in", () => {
    const session = aSession("2026-09-11T06:00:00Z", "2026-09-11T14:00:00Z", [
      aBreak("2026-09-11T12:00:00Z", "2026-09-11T12:10:00Z"),
      aBreak("2026-09-11T09:00:00Z", "2026-09-11T09:10:00Z"),
    ]);

    expect(buildTimeline(session, NOW).map((segment) => segment.startedAt)).toEqual([
      "2026-09-11T06:00:00Z",
      "2026-09-11T09:00:00Z",
      "2026-09-11T09:10:00Z",
      "2026-09-11T12:00:00Z",
      "2026-09-11T12:10:00Z",
    ]);
  });
});

describe("formatClockTime", () => {
  it("reads the instant in the organization's zone, not the browser's", () => {
    expect(formatClockTime("2026-09-11T06:42:00Z", ZONE)).toBe("08:42");
  });

  it("falls back to the browser's zone for one it does not know", () => {
    expect(formatClockTime("2026-09-11T06:42:00Z", "Mars/Olympus")).toMatch(/^\d{2}:\d{2}$/);
  });

  it("returns an empty string for an unparseable instant", () => {
    expect(formatClockTime("nope", ZONE)).toBe("");
  });
});

describe("clockStateOf", () => {
  it("is inactive whenever attendance is not live, whatever is open", () => {
    expect(
      clockStateOf({
        active: false,
        openSession: aSession("2026-09-11T06:00:00Z"),
        openBreak: null,
      })
    ).toBe("inactive");
  });

  it("is out with nothing open", () => {
    expect(clockStateOf({ active: true, openSession: null, openBreak: null })).toBe("out");
  });

  it("is in with a session and no break", () => {
    expect(
      clockStateOf({ active: true, openSession: aSession("2026-09-11T06:00:00Z"), openBreak: null })
    ).toBe("in");
  });

  it("is break with both open", () => {
    expect(
      clockStateOf({
        active: true,
        openSession: aSession("2026-09-11T06:00:00Z"),
        openBreak: aBreak("2026-09-11T12:00:00Z"),
      })
    ).toBe("break");
  });
});
