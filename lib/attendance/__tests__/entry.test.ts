import { describe, expect, it } from "vitest";
import { entryErrors, entrySpan, type EntryDraft } from "../entry";

const PRAGUE = "Europe/Prague";

const draft = (overrides: Partial<EntryDraft> = {}): EntryDraft => ({
  businessDate: "2026-09-08",
  startedAt: "08:10",
  endedAt: "16:55",
  nextDay: false,
  ...overrides,
});

// Friday 11 September 2026, 12:19 in Prague.
const now = new Date("2026-09-11T10:19:00Z");

const check = (entry: EntryDraft, overrides: Partial<Parameters<typeof entryErrors>[1]> = {}) =>
  entryErrors(entry, {
    timezone: PRAGUE,
    now,
    today: "2026-09-11",
    earliest: "2026-09-04",
    sessions: [],
    ...overrides,
  });

describe("entrySpan", () => {
  it("returns the two instants in the organization's zone", () => {
    expect(entrySpan(draft(), PRAGUE)).toEqual({
      startedAt: "2026-09-08T06:10:00.000Z",
      endedAt: "2026-09-08T14:55:00.000Z",
    });
  });

  it("puts the end on the next day when the switch is on", () => {
    expect(
      entrySpan(draft({ startedAt: "22:00", endedAt: "06:15", nextDay: true }), PRAGUE)
    ).toEqual({ startedAt: "2026-09-08T20:00:00.000Z", endedAt: "2026-09-09T04:15:00.000Z" });
  });

  it("returns null for a field that is not a time yet", () => {
    expect(entrySpan(draft({ endedAt: "" }), PRAGUE).endedAt).toBeNull();
  });
});

describe("entryErrors", () => {
  it("returns nothing for a day inside the window", () => {
    expect(check(draft())).toEqual({});
  });

  it("asks for a date and both times", () => {
    expect(check(draft({ businessDate: "", startedAt: "", endedAt: "" }))).toEqual({
      businessDate: { kind: "REQUIRED" },
      startedAt: { kind: "REQUIRED" },
      endedAt: { kind: "REQUIRED" },
    });
  });

  it("refuses a date before the window and one after today", () => {
    expect(check(draft({ businessDate: "2026-09-03" })).businessDate).toEqual({
      kind: "OUTSIDE_WINDOW",
    });
    expect(check(draft({ businessDate: "2026-09-12" })).businessDate).toEqual({
      kind: "FUTURE_DATE",
    });
  });

  it("takes any past date without a window", () => {
    expect(check(draft({ businessDate: "2026-01-05" }), { earliest: null })).toEqual({});
  });

  it("refuses an end before its start on the same day, and takes it as a night shift", () => {
    expect(check(draft({ startedAt: "16:55", endedAt: "08:10" })).endedAt).toEqual({
      kind: "END_BEFORE_START",
    });
    expect(check(draft({ startedAt: "22:00", endedAt: "06:15", nextDay: true }))).toEqual({});
  });

  it("refuses an end later than now, naming now", () => {
    expect(
      check(draft({ businessDate: "2026-09-11", startedAt: "13:00", endedAt: "17:00" })).endedAt
    ).toEqual({ kind: "END_IN_FUTURE", now: "12:19" });
  });

  it("names the session it would run over, an open one included", () => {
    const sessions = [
      { startedAt: "2026-09-08T06:05:00.000Z", endedAt: "2026-09-08T15:10:00.000Z" },
    ];

    expect(check(draft({ startedAt: "07:30", endedAt: "12:00" }), { sessions }).startedAt).toEqual({
      kind: "OVERLAPS",
      from: "08:05",
      to: "17:10",
    });
    expect(check(draft({ startedAt: "17:10", endedAt: "18:00" }), { sessions })).toEqual({});

    expect(
      check(draft({ startedAt: "18:00", endedAt: "19:00" }), {
        sessions: [{ startedAt: "2026-09-08T15:30:00.000Z", endedAt: null }],
      }).startedAt
    ).toEqual({ kind: "OVERLAPS", from: "17:30", to: null });
  });

  it("keeps the date inside the spell the team read gives away", () => {
    const spell = { began: "2026-09-08", ended: null };

    expect(
      check(draft({ businessDate: "2026-09-07" }), { earliest: null, spell }).businessDate
    ).toEqual({ kind: "BEFORE_EMPLOYMENT", began: "2026-09-08" });
    expect(check(draft(), { earliest: null, spell })).toEqual({});
    expect(
      check(draft({ businessDate: "2026-09-09" }), {
        earliest: null,
        spell: { began: null, ended: "2026-09-08" },
      }).businessDate
    ).toEqual({ kind: "AFTER_EMPLOYMENT", ended: "2026-09-08" });
  });
});
