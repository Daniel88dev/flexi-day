import { describe, expect, it } from "vitest";
import { ageAtNextBirthday, daysInMonth, parseBirthYear, shareSwitchState } from "../birthday";

const today = new Date(2026, 9, 18);

describe("daysInMonth", () => {
  it("allows 29 days in February and 31 before a month is picked", () => {
    expect(daysInMonth(2)).toBe(29);
    expect(daysInMonth(4)).toBe(30);
    expect(daysInMonth(12)).toBe(31);
    expect(daysInMonth(null)).toBe(31);
  });
});

describe("parseBirthYear", () => {
  it("returns null for an empty field", () => {
    expect(parseBirthYear("", today)).toEqual({ year: null, valid: true });
  });

  it("accepts four digits from 1900 to this year", () => {
    expect(parseBirthYear("1900", today)).toEqual({ year: 1900, valid: true });
    expect(parseBirthYear("2026", today)).toEqual({ year: 2026, valid: true });
  });

  it("refuses a short, early or future year", () => {
    expect(parseBirthYear("198", today).valid).toBe(false);
    expect(parseBirthYear("1899", today).valid).toBe(false);
    expect(parseBirthYear("2027", today).valid).toBe(false);
  });
});

describe("ageAtNextBirthday", () => {
  it("returns the age turned later this year", () => {
    expect(ageAtNextBirthday({ month: 10, day: 25, year: 1987 }, today)).toBe(39);
  });

  it("counts today as the next birthday", () => {
    expect(ageAtNextBirthday({ month: 10, day: 18, year: 1990 }, today)).toBe(36);
  });

  it("moves to next year once the day has passed", () => {
    expect(ageAtNextBirthday({ month: 3, day: 14, year: 1988 }, today)).toBe(39);
  });

  it("puts 29 February on 28 February in a year without it", () => {
    expect(ageAtNextBirthday({ month: 2, day: 29, year: 1990 }, new Date(2027, 1, 28))).toBe(37);
  });

  it("returns null without a year", () => {
    expect(ageAtNextBirthday({ month: 10, day: 25, year: null }, today)).toBeNull();
  });
});

describe("shareSwitchState", () => {
  const groups = [{ groupId: "g1", groupName: "Platform" }];

  it("opens the switch while a group is on a paid plan", () => {
    expect(shareSwitchState({ canShare: true, storedShared: false, shareGroups: groups })).toBe(
      "open"
    );
  });

  it("shows the notice with no paid or lapsed group", () => {
    expect(shareSwitchState({ canShare: false, storedShared: false, shareGroups: [] })).toBe(
      "notice"
    );
  });

  it("keeps the switch for turning off once every group lapsed", () => {
    expect(shareSwitchState({ canShare: false, storedShared: true, shareGroups: groups })).toBe(
      "lapsed"
    );
    expect(shareSwitchState({ canShare: false, storedShared: false, shareGroups: groups })).toBe(
      "lapsed"
    );
    expect(shareSwitchState({ canShare: false, storedShared: true, shareGroups: [] })).toBe(
      "lapsed"
    );
  });
});
