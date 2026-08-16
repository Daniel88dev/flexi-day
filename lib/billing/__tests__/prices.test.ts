import { describe, expect, it } from "vitest";
import { PLAN_PRICES, SLOT_PRICE, TRIAL, formatEur } from "@/lib/billing/prices";

describe("TRIAL", () => {
  it("mirrors the trial configured on the Paddle prices", () => {
    expect(TRIAL.monthly).toEqual({ count: 10, unit: "day" });
    expect(TRIAL.yearly).toEqual({ count: 2, unit: "month" });
  });
});

describe("PLAN_PRICES", () => {
  it("prices a year below twelve months, so the yearly badge is honest", () => {
    for (const plan of ["PRO", "ENTERPRISE"] as const) {
      expect(PLAN_PRICES[plan].yearly).toBeLessThan(PLAN_PRICES[plan].monthly * 12);
    }
  });

  it("discounts both plans by the 17% the pricing toggle advertises", () => {
    for (const plan of ["PRO", "ENTERPRISE"] as const) {
      const { monthly, yearly } = PLAN_PRICES[plan];
      const discount = 1 - yearly / (monthly * 12);
      expect(discount).toBeCloseTo(0.17, 2);
    }
  });
});

describe("formatEur", () => {
  it("drops the decimals on a whole amount", () => {
    expect(formatEur("en-GB", PLAN_PRICES.PRO.monthly)).toBe("€8");
  });

  it("keeps the decimals on a fractional amount", () => {
    expect(formatEur("en-GB", SLOT_PRICE.monthly)).toBe("€1.50");
  });
});
