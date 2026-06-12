import { describe, it, expect } from "vitest";
import {
  getInitials,
  getMemberById,
  countBusinessDays,
  TEAM_MEMBERS,
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_COLORS,
} from "@/lib/data";

describe("getInitials", () => {
  it("returns uppercase initials for a two-word name", () => {
    expect(getInitials("Alice Chen")).toBe("AC");
  });

  it("returns uppercase initials for a three-word name", () => {
    expect(getInitials("Mary Jane Watson")).toBe("MJW");
  });

  it("returns a single letter for a one-word name", () => {
    expect(getInitials("Prince")).toBe("P");
  });

  it("handles lowercase input and uppercases the result", () => {
    expect(getInitials("john doe")).toBe("JD");
  });
});

describe("getMemberById", () => {
  it("returns the correct member for a valid id", () => {
    const member = getMemberById("1");
    expect(member).toBeDefined();
    expect(member?.name).toBe("Alice Chen");
    expect(member?.role).toBe("Frontend Dev");
  });

  it("returns undefined for an id that does not exist", () => {
    expect(getMemberById("999")).toBeUndefined();
  });

  it("returns undefined for an empty string", () => {
    expect(getMemberById("")).toBeUndefined();
  });

  it("returns all five team members via successive lookups", () => {
    const found = TEAM_MEMBERS.map((m) => getMemberById(m.id));
    expect(found.every((m) => m !== undefined)).toBe(true);
  });
});

describe("countBusinessDays", () => {
  it("counts a single Monday as 1 business day", () => {
    // 2026-06-15 is a Monday
    expect(countBusinessDays("2026-06-15", "2026-06-15")).toBe(1);
  });

  it("counts Mon–Fri as 5 business days", () => {
    // 2026-06-15 (Mon) → 2026-06-19 (Fri)
    expect(countBusinessDays("2026-06-15", "2026-06-19")).toBe(5);
  });

  it("excludes Saturday and Sunday from a full week range", () => {
    // Mon–Sun = 5 business days
    expect(countBusinessDays("2026-06-15", "2026-06-21")).toBe(5);
  });

  it("counts two full work weeks as 10 business days", () => {
    // Mon 2026-06-15 → Fri 2026-06-26
    expect(countBusinessDays("2026-06-15", "2026-06-26")).toBe(10);
  });

  it("returns 0 for a range that falls entirely on a weekend", () => {
    // Sat 2026-06-20 → Sun 2026-06-21
    expect(countBusinessDays("2026-06-20", "2026-06-21")).toBe(0);
  });

  it("returns 1 for a Saturday–Monday range (only Monday counts)", () => {
    // Sat 2026-06-20 → Mon 2026-06-22
    expect(countBusinessDays("2026-06-20", "2026-06-22")).toBe(1);
  });
});

describe("LEAVE_TYPE_LABELS", () => {
  it("has a label for every leave type", () => {
    const types = ["vacation", "sick", "remote", "holiday"] as const;
    types.forEach((t) => {
      expect(LEAVE_TYPE_LABELS[t]).toBeTruthy();
    });
  });
});

describe("LEAVE_TYPE_COLORS", () => {
  it("has a color string for every leave type", () => {
    const types = ["vacation", "sick", "remote", "holiday"] as const;
    types.forEach((t) => {
      expect(LEAVE_TYPE_COLORS[t]).toBeTruthy();
    });
  });
});
