import { describe, expect, it } from "vitest";
import { ruleSummary } from "../labels";
import type { RepeatRule } from "@/lib/api/group-events";
import { en } from "@/lib/i18n/dictionaries/en";
import { cs } from "@/lib/i18n/dictionaries/cs";

const rule = (patch: Partial<RepeatRule> & Pick<RepeatRule, "freq">): RepeatRule => ({
  interval: 1,
  weekdays: [],
  monthlyMode: null,
  until: null,
  ...patch,
});

describe("ruleSummary", () => {
  it("returns daily rules with their interval", () => {
    expect(ruleSummary("2026-10-01", rule({ freq: "daily" }), en)).toBe("Every day");
    expect(ruleSummary("2026-10-01", rule({ freq: "daily", interval: 3 }), en)).toBe(
      "Every 3 days"
    );
  });

  it("returns weekly rules with their weekdays, and Monday to Friday as every weekday", () => {
    expect(
      ruleSummary("2026-10-06", rule({ freq: "weekly", interval: 2, weekdays: [1, 3] }), en)
    ).toBe("Every 2 weeks on Tue, Thu");
    expect(ruleSummary("2026-10-05", rule({ freq: "weekly", weekdays: [0, 1, 2, 3, 4] }), en)).toBe(
      "Every weekday"
    );
  });

  it("returns monthly rules read off the start date", () => {
    expect(ruleSummary("2027-01-31", rule({ freq: "monthly", monthlyMode: "day" }), en)).toBe(
      "Every month on day 31"
    );
    expect(ruleSummary("2026-10-13", rule({ freq: "monthly", monthlyMode: "weekday" }), en)).toBe(
      "Every month on the 2nd Tuesday"
    );
    expect(
      ruleSummary(
        "2026-10-30",
        rule({ freq: "monthly", interval: 2, monthlyMode: "lastWeekday" }),
        en
      )
    ).toBe("Every 2 months on the last Friday");
  });

  it("returns a yearly rule with its end date", () => {
    expect(ruleSummary("2028-02-29", rule({ freq: "yearly", until: "2030-03-01" }), en)).toBe(
      "Every year on 29 February, until 1 March 2030"
    );
  });

  it("returns Czech with Czech plurals", () => {
    expect(ruleSummary("2026-10-01", rule({ freq: "daily", interval: 3 }), cs)).toBe("Každé 3 dny");
    expect(ruleSummary("2026-10-01", rule({ freq: "daily", interval: 5 }), cs)).toBe(
      "Každých 5 dní"
    );
    expect(ruleSummary("2026-10-13", rule({ freq: "monthly", monthlyMode: "weekday" }), cs)).toBe(
      "Každý měsíc, 2. úterý"
    );
    expect(
      ruleSummary("2026-10-05", rule({ freq: "weekly", weekdays: [0, 2], until: "2026-11-03" }), cs)
    ).toBe("Každý týden: Po, St, do 3. listopadu 2026");
  });
});
