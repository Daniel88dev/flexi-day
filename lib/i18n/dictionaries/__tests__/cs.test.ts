import { describe, expect, it } from "vitest";
import { cs } from "../cs";

describe("cs.vacationDetail.workingDays", () => {
  it("returns the count in all three plural forms", () => {
    expect(cs.vacationDetail.workingDays(1)).toBe("1 pracovní den");
    expect(cs.vacationDetail.workingDays(3)).toBe("3 pracovní dny");
    expect(cs.vacationDetail.workingDays(7)).toBe("7 pracovních dní");
  });
});

describe("cs.vacationDetail.days", () => {
  it("returns the count in all three plural forms", () => {
    expect(cs.vacationDetail.days(1)).toBe("1 den");
    expect(cs.vacationDetail.days(4)).toBe("4 dny");
    expect(cs.vacationDetail.days(5)).toBe("5 dní");
  });
});
