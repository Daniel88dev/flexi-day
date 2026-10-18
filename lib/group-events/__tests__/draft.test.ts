import { describe, expect, it } from "vitest";
import type { GroupEventGroup, GroupEventRow, RepeatRule } from "@/lib/api/group-events";
import {
  blankDraft,
  createInput,
  defaultRule,
  draftFromEvent,
  draftProblem,
  createGroups,
  editRequest,
  fitRule,
  moveOccurrence,
  nextDates,
  previewDates,
  ruleChanged,
  shiftRule,
  withDates,
} from "../draft";
import { occurrences } from "../occurrences";

const weekly = (weekdays: number[], until: string | null = null): RepeatRule => ({
  freq: "weekly",
  interval: 1,
  weekdays,
  monthlyMode: null,
  until,
});

const ROW: GroupEventRow = {
  id: "ge-1",
  groupId: "g-1",
  groupName: "Dev Team",
  title: "Standup",
  note: null,
  startDate: "2026-10-05",
  endDate: "2026-10-05",
  startTime: "09:30",
  endTime: "09:45",
  repeat: weekly([0, 2]),
  skippedDates: [],
  recurringEventId: null,
  originalDate: null,
  createdBy: null,
  canEdit: true,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

const OFFSITE: GroupEventRow = {
  ...ROW,
  id: "ge-2",
  title: "Offsite",
  note: "Bring boots",
  startDate: "2026-11-02",
  endDate: "2026-11-04",
  startTime: null,
  endTime: null,
  repeat: null,
};

describe("blankDraft", () => {
  it("starts an all-day, one-day group event on the date with 09:00 to 10:00 ready", () => {
    expect(blankDraft("2026-10-21", "g-1")).toEqual({
      groupId: "g-1",
      title: "",
      note: "",
      startDate: "2026-10-21",
      endDate: "2026-10-21",
      allDay: true,
      startTime: "09:00",
      endTime: "10:00",
      repeat: null,
    });
  });
});

describe("defaultRule", () => {
  it("ticks the start's weekday for a weekly rule", () => {
    expect(defaultRule("weekly", "2026-10-21")).toEqual(weekly([2]));
  });

  it("repeats a monthly rule on the start's day", () => {
    expect(defaultRule("monthly", "2026-10-21")).toEqual({
      freq: "monthly",
      interval: 1,
      weekdays: [],
      monthlyMode: "day",
      until: null,
    });
  });
});

describe("fitRule", () => {
  it("adds the start's weekday to a weekly rule and sorts the days", () => {
    expect(fitRule(weekly([4, 0]), "2026-10-21")).toEqual(weekly([0, 2, 4]));
  });

  it("turns the nth weekday into the last one on a 5th weekday", () => {
    const rule: RepeatRule = { ...defaultRule("monthly", "2026-10-30"), monthlyMode: "weekday" };
    expect(fitRule(rule, "2026-10-30").monthlyMode).toBe("lastWeekday");
  });

  it("turns the last weekday into the nth one when the start is not the last", () => {
    const rule: RepeatRule = {
      ...defaultRule("monthly", "2026-10-13"),
      monthlyMode: "lastWeekday",
    };
    expect(fitRule(rule, "2026-10-13").monthlyMode).toBe("weekday");
  });
});

describe("nextDates", () => {
  it("lists the next six dates of a weekly rule from the start", () => {
    expect(nextDates("2026-10-05", weekly([0, 2]))).toEqual([
      "2026-10-05",
      "2026-10-07",
      "2026-10-12",
      "2026-10-14",
      "2026-10-19",
      "2026-10-21",
    ]);
  });

  it("lands a monthly day 31 on each month's last day", () => {
    expect(nextDates("2027-01-31", { ...defaultRule("monthly", "2027-01-31") })).toEqual([
      "2027-01-31",
      "2027-02-28",
      "2027-03-31",
      "2027-04-30",
      "2027-05-31",
      "2027-06-30",
    ]);
  });

  it("stops at the end date", () => {
    const rule: RepeatRule = {
      ...defaultRule("daily", "2026-10-01"),
      interval: 3,
      until: "2026-10-10",
    };
    expect(nextDates("2026-10-01", rule)).toEqual([
      "2026-10-01",
      "2026-10-04",
      "2026-10-07",
      "2026-10-10",
    ]);
  });

  it("reaches six dates of a rule repeating every 99 years", () => {
    const rule: RepeatRule = { ...defaultRule("yearly", "2026-10-21"), interval: 99 };
    expect(nextDates("2026-10-21", rule)).toHaveLength(6);
  });
});

describe("withDates", () => {
  it("keeps a multi-day event's length when its start moves", () => {
    const draft = { ...blankDraft("2026-11-02", "g-1"), endDate: "2026-11-04" };
    expect(withDates(draft, { startDate: "2026-11-09" })).toMatchObject({
      startDate: "2026-11-09",
      endDate: "2026-11-11",
    });
  });

  it("turns repeat off once the end passes the start", () => {
    const draft = { ...blankDraft("2026-10-21", "g-1"), repeat: weekly([2]) };
    expect(withDates(draft, { endDate: "2026-10-22" })).toMatchObject({
      endDate: "2026-10-22",
      repeat: null,
    });
  });

  it("never lets the end fall before the start", () => {
    const draft = blankDraft("2026-10-21", "g-1");
    expect(withDates(draft, { endDate: "2026-10-20" }).endDate).toBe("2026-10-21");
  });
});

describe("draftProblem", () => {
  const ok = { ...blankDraft("2026-10-21", "g-1"), title: "Retro" };

  it("passes a titled all-day draft", () => {
    expect(draftProblem(ok)).toBeNull();
  });

  it("asks for a title", () => {
    expect(draftProblem({ ...ok, title: "   " })).toBe("title");
  });

  it("asks for a group", () => {
    expect(draftProblem({ ...ok, groupId: null })).toBe("group");
  });

  it("refuses a single day that ends before it starts", () => {
    expect(draftProblem({ ...ok, allDay: false, startTime: "10:00", endTime: "10:00" })).toBe(
      "endsBeforeStart"
    );
  });

  it("lets a timed run of days end earlier on the clock", () => {
    expect(
      draftProblem({
        ...ok,
        endDate: "2026-10-22",
        allDay: false,
        startTime: "16:00",
        endTime: "10:00",
      })
    ).toBeNull();
  });

  it("refuses a repeat that ends before the start", () => {
    expect(draftProblem({ ...ok, repeat: weekly([2], "2026-10-20") })).toBe("untilBeforeStart");
  });
});

describe("createInput", () => {
  it("sends an all-day draft without times and an empty note as null", () => {
    expect(createInput({ ...blankDraft("2026-10-21", "g-1"), title: "  Retro " })).toEqual({
      groupId: "g-1",
      title: "Retro",
      note: null,
      startDate: "2026-10-21",
      endDate: "2026-10-21",
      startTime: null,
      endTime: null,
      repeat: null,
    });
  });

  it("sends the times and the fitted rule of a timed weekly draft", () => {
    const draft = {
      ...blankDraft("2026-10-21", "g-1"),
      title: "Standup",
      allDay: false,
      startTime: "09:30",
      endTime: "09:45",
      repeat: weekly([0]),
    };
    expect(createInput(draft)).toMatchObject({
      startTime: "09:30",
      endTime: "09:45",
      repeat: weekly([0, 2]),
    });
  });
});

describe("draftFromEvent", () => {
  it("opens a recurring group event on the occurrence picked", () => {
    expect(draftFromEvent(ROW, "2026-10-14")).toEqual({
      groupId: "g-1",
      title: "Standup",
      note: "",
      startDate: "2026-10-14",
      endDate: "2026-10-14",
      allDay: false,
      startTime: "09:30",
      endTime: "09:45",
      repeat: weekly([0, 2]),
    });
  });

  it("opens a one-off on its own dates with 09:00 to 10:00 ready for times", () => {
    expect(draftFromEvent(OFFSITE, "2026-11-02")).toMatchObject({
      startDate: "2026-11-02",
      endDate: "2026-11-04",
      allDay: true,
      startTime: "09:00",
      endTime: "10:00",
      note: "Bring boots",
    });
  });
});

describe("ruleChanged", () => {
  const target = { event: ROW, occurrenceDate: "2026-10-14" };

  it("is false when only the date moves", () => {
    const draft = moveOccurrence(draftFromEvent(ROW, "2026-10-14"), "2026-10-15");
    expect(ruleChanged(target, draft)).toBe(false);
  });

  it("is true when the weekdays change", () => {
    const draft = { ...draftFromEvent(ROW, "2026-10-14"), repeat: weekly([0, 2, 4]) };
    expect(ruleChanged(target, draft)).toBe(true);
  });

  it("is true when repeat is turned off", () => {
    expect(ruleChanged(target, { ...draftFromEvent(ROW, "2026-10-14"), repeat: null })).toBe(true);
  });
});

describe("shiftRule", () => {
  it("moves a weekly rule's weekdays and its last date, wrapping the week", () => {
    expect(shiftRule(weekly([1, 6], "2026-11-03"), 1)).toEqual(weekly([0, 2], "2026-11-04"));
    expect(shiftRule(weekly([0], "2026-11-02"), -1)).toEqual(weekly([6], "2026-11-01"));
  });

  it("moves only the last date of a rule without weekdays", () => {
    const daily: RepeatRule = { ...defaultRule("daily", "2026-10-20"), until: "2026-10-31" };
    expect(shiftRule(daily, 2)).toEqual({ ...daily, until: "2026-11-02" });
  });
});

describe("moveOccurrence", () => {
  it("keeps the occurrence one day and moves its rule with it", () => {
    const draft = draftFromEvent({ ...ROW, repeat: weekly([1], "2026-11-03") }, "2026-10-20");
    expect(moveOccurrence(draft, "2026-10-21")).toMatchObject({
      startDate: "2026-10-21",
      endDate: "2026-10-21",
      repeat: weekly([2], "2026-11-04"),
    });
  });
});

describe("a weekly Tuesday occurrence moved to Wednesday", () => {
  const TUESDAYS: GroupEventRow = {
    ...ROW,
    startDate: "2026-10-06",
    endDate: "2026-10-06",
    repeat: weekly([1], "2026-11-03"),
  };
  const target = { event: TUESDAYS, occurrenceDate: "2026-10-20" };
  const draft = moveOccurrence(draftFromEvent(TUESDAYS, "2026-10-20"), "2026-10-21");
  const savedFrom = (changes: { startDate?: string; repeat?: RepeatRule | null }) =>
    occurrences(
      {
        startDate: changes.startDate ?? "",
        endDate: changes.startDate ?? "",
        repeat: changes.repeat ?? null,
        skippedDates: [],
      },
      "2026-10-20",
      "2027-12-31"
    ).map((o) => o.startDate);

  it("is not a rule change", () => {
    expect(ruleChanged(target, draft)).toBe(false);
  });

  it("moves that date alone with this event, and previews the rest unchanged", () => {
    const { changes } = editRequest(target, draft, "this");
    expect(changes).toMatchObject({ startDate: "2026-10-21", endDate: "2026-10-21" });
    expect(changes).not.toHaveProperty("repeat");
    expect(previewDates(target, draft, "this")).toEqual(["2026-10-21", "2026-10-27", "2026-11-03"]);
  });

  it("moves the start, the weekday and the last date with this and following", () => {
    const { changes } = editRequest(target, draft, "following");
    expect(changes).toMatchObject({
      startDate: "2026-10-21",
      endDate: "2026-10-21",
      repeat: weekly([2], "2026-11-04"),
    });
    expect(previewDates(target, draft, "following")).toEqual(savedFrom(changes));
    expect(savedFrom(changes)).toEqual(["2026-10-21", "2026-10-28", "2026-11-04"]);
  });

  it("moves the first date, the weekday and the last date with all events", () => {
    const { changes } = editRequest(target, draft, "all");
    expect(changes).toMatchObject({
      startDate: "2026-10-07",
      endDate: "2026-10-07",
      repeat: weekly([2], "2026-11-04"),
    });
    expect(previewDates(target, draft, "all")).toEqual(savedFrom(changes));
  });

  it("previews the moved rule before a scope is picked", () => {
    expect(previewDates(target, draft, null)).toEqual(["2026-10-21", "2026-10-28", "2026-11-04"]);
  });
});

describe("createGroups", () => {
  const groups: GroupEventGroup[] = [
    { groupId: "g-1", groupName: "Dev Team", canCreate: true },
    { groupId: "g-2", groupName: "Design", canCreate: true },
    { groupId: "g-3", groupName: "Free crew", canCreate: false },
  ];

  it("lists the groups that can create and selects the one picked", () => {
    expect(createGroups(groups, "g-2", "g-1")).toEqual({
      creatable: groups.slice(0, 2),
      selected: groups[1],
    });
  });

  it("selects the requested group when it can create, else the first that can", () => {
    expect(createGroups(groups, null, "g-2").selected).toBe(groups[1]);
    expect(createGroups(groups, null, "g-3").selected).toBe(groups[0]);
    expect(createGroups([groups[2]], null, null)).toEqual({ creatable: [], selected: null });
  });
});

describe("editRequest", () => {
  it("edits a one-off without a scope", () => {
    const draft = { ...draftFromEvent(OFFSITE, "2026-11-02"), title: "Team offsite" };
    expect(editRequest({ event: OFFSITE, occurrenceDate: "2026-11-02" }, draft, undefined)).toEqual(
      {
        changes: {
          title: "Team offsite",
          note: "Bring boots",
          startDate: "2026-11-02",
          endDate: "2026-11-04",
          startTime: null,
          endTime: null,
          repeat: null,
        },
      }
    );
  });

  it("moves one occurrence with this event and leaves the rule out", () => {
    const draft = moveOccurrence(draftFromEvent(ROW, "2026-10-14"), "2026-10-15");
    expect(editRequest({ event: ROW, occurrenceDate: "2026-10-14" }, draft, "this")).toEqual({
      scope: "this",
      occurrenceDate: "2026-10-14",
      changes: {
        title: "Standup",
        note: null,
        startDate: "2026-10-15",
        endDate: "2026-10-15",
        startTime: "09:30",
        endTime: "09:45",
      },
    });
  });

  it("starts the new rule on the occurrence with this and following", () => {
    const draft = { ...draftFromEvent(ROW, "2026-10-14"), repeat: weekly([2, 4]) };
    expect(editRequest({ event: ROW, occurrenceDate: "2026-10-14" }, draft, "following")).toEqual({
      scope: "following",
      occurrenceDate: "2026-10-14",
      changes: expect.objectContaining({
        startDate: "2026-10-14",
        endDate: "2026-10-14",
        repeat: weekly([2, 4]),
      }),
    });
  });

  it("keeps the first date with all events when the occurrence keeps its date", () => {
    const draft = { ...draftFromEvent(ROW, "2026-10-14"), title: "Daily sync" };
    expect(editRequest({ event: ROW, occurrenceDate: "2026-10-14" }, draft, "all")).toEqual({
      scope: "all",
      occurrenceDate: "2026-10-14",
      changes: {
        title: "Daily sync",
        note: null,
        startDate: "2026-10-05",
        endDate: "2026-10-05",
        startTime: "09:30",
        endTime: "09:45",
        repeat: weekly([0, 2]),
      },
    });
  });

  it("moves every date by as many days as the occurrence moved with all events", () => {
    const draft = moveOccurrence(draftFromEvent(ROW, "2026-10-14"), "2026-10-15");
    expect(
      editRequest({ event: ROW, occurrenceDate: "2026-10-14" }, draft, "all").changes
    ).toMatchObject({ startDate: "2026-10-06", endDate: "2026-10-06", repeat: weekly([1, 3]) });
  });
});
