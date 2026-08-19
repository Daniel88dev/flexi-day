import { describe, expect, it } from "vitest";
import { assignMemberColors, CHART_FALLBACK_COLORS } from "@/lib/report/colors";
import type { ReportScopeMember } from "@/lib/api/report-types";

const member = (id: string, name: string, avatarColor: string): ReportScopeMember => ({
  id,
  name,
  initials: name.slice(0, 2).toUpperCase(),
  avatarColor,
  groupId: "g1",
});

describe("assignMemberColors", () => {
  it("keeps distinct avatar colors as-is", () => {
    const colors = assignMemberColors([
      member("u1", "Ada", "hsl(200, 65%, 50%)"),
      member("u2", "Bob", "hsl(30, 70%, 55%)"),
    ]);

    expect(colors.u1).toBe("hsl(200, 65%, 50%)");
    expect(colors.u2).toBe("hsl(30, 70%, 55%)");
  });

  it("reassigns a colliding avatar color from the fallback palette", () => {
    const colors = assignMemberColors([
      member("u1", "Ada", "hsl(200, 65%, 50%)"),
      member("u2", "Bob", "hsl(210, 60%, 52%)"),
    ]);

    expect(colors.u1).toBe("hsl(200, 65%, 50%)");
    expect(colors.u2).not.toBe("hsl(210, 60%, 52%)");
    expect(CHART_FALLBACK_COLORS).toContain(colors.u2);
    // The fallback must not collide with the kept avatar blue either.
    expect(colors.u2).not.toBe("#2a78d6");
  });

  it("falls back for an unparsable avatar color", () => {
    const colors = assignMemberColors([member("u1", "Ada", "rebeccapurple")]);

    expect(CHART_FALLBACK_COLORS).toContain(colors.u1);
  });

  it("assigns by name order regardless of input order, and dedupes by id", () => {
    const a = [
      member("u2", "Bob", "hsl(200, 65%, 50%)"),
      member("u1", "Ada", "hsl(205, 65%, 50%)"),
      member("u1", "Ada", "hsl(205, 65%, 50%)"),
    ];
    const b = [...a].reverse();

    expect(assignMemberColors(a)).toEqual(assignMemberColors(b));
    // Ada sorts first, so she keeps her avatar color and Bob gets bumped.
    expect(assignMemberColors(a).u1).toBe("hsl(205, 65%, 50%)");
  });

  it("gives every member a color even past the fallback palette size", () => {
    const members = Array.from({ length: 12 }, (_, i) =>
      member(`u${i}`, `User ${String.fromCharCode(65 + i)}`, "hsl(200, 65%, 50%)")
    );

    const colors = assignMemberColors(members);

    expect(Object.keys(colors)).toHaveLength(12);
    expect(Object.values(colors).every(Boolean)).toBe(true);
  });
});
