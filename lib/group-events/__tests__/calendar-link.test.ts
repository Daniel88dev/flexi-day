import { describe, expect, it } from "vitest";
import { calendarLanding, groupEventCalendarHref, withoutCalendarLanding } from "../calendar-link";

describe("groupEventCalendarHref", () => {
  it("returns the dashboard on the group and the month of the first date", () => {
    expect(groupEventCalendarHref({ groupId: "g-1", startDate: "2026-11-03" })).toBe(
      "/dashboard/?groupId=g-1&month=2026-11"
    );
  });
});

describe("calendarLanding", () => {
  it("returns the group, year and month a link asks for", () => {
    expect(calendarLanding("?groupId=g-1&month=2026-11")).toEqual({
      groupId: "g-1",
      year: 2026,
      month: 11,
    });
  });

  it("returns null without both a group and a valid month", () => {
    expect(calendarLanding("")).toBeNull();
    expect(calendarLanding("?groupId=g-1")).toBeNull();
    expect(calendarLanding("?month=2026-11")).toBeNull();
    expect(calendarLanding("?groupId=g-1&month=2026-13")).toBeNull();
    expect(calendarLanding("?groupId=g-1&month=nov")).toBeNull();
  });
});

describe("withoutCalendarLanding", () => {
  it("drops the landing and keeps any other parameter", () => {
    expect(withoutCalendarLanding("?groupId=g-1&month=2026-11&vacationId=v-1")).toBe(
      "?vacationId=v-1"
    );
    expect(withoutCalendarLanding("?groupId=g-1&month=2026-11")).toBe("");
  });
});
