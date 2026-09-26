import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/client";
import { en } from "@/lib/i18n/dictionaries/en";
import { planLimitFromError, planLimitMessage } from "../plan-limit-error";

const make402 = (context: unknown) =>
  new ApiError(402, "Your plan's group limit has been reached", null, [
    { message: "Your plan's group limit has been reached", context: context as never },
  ]);

describe("planLimitFromError", () => {
  it("reads reason, limit and current from a 402", () => {
    const error = make402({ reason: "PLAN_LIMIT", limit: 3, current: 3 });
    expect(planLimitFromError(error)).toEqual({ reason: "PLAN_LIMIT", limit: 3, current: 3 });
  });

  it("recognises READ_ONLY", () => {
    const error = make402({ reason: "READ_ONLY", limit: 3, current: 5 });
    expect(planLimitFromError(error)?.reason).toBe("READ_ONLY");
  });

  it("returns null for a non-402 ApiError", () => {
    const error = new ApiError(409, "conflict", null, [
      { message: "conflict", context: { reason: "PLAN_LIMIT", limit: 3, current: 3 } as never },
    ]);
    expect(planLimitFromError(error)).toBeNull();
  });

  it("returns null when the 402 carries no recognisable context", () => {
    expect(planLimitFromError(make402(undefined))).toBeNull();
    expect(planLimitFromError(make402({ reason: "SOMETHING_ELSE" }))).toBeNull();
  });

  it("returns null for a plain Error", () => {
    expect(planLimitFromError(new Error("boom"))).toBeNull();
    expect(planLimitFromError(null)).toBeNull();
  });

  it("defaults missing numeric fields to 0 rather than rendering NaN", () => {
    const error = make402({ reason: "PLAN_LIMIT" });
    expect(planLimitFromError(error)).toEqual({ reason: "PLAN_LIMIT", limit: 0, current: 0 });
  });
});

describe("planLimitMessage", () => {
  it("names the member limit for a full group", () => {
    const error = make402({ reason: "PLAN_LIMIT", limit: 10, current: 10 });
    expect(planLimitMessage(error, en)).toBe("This group is at its 10-member limit.");
  });

  it("says the group is read-only when the plan lapsed", () => {
    const error = make402({ reason: "READ_ONLY", limit: 3, current: 5 });
    expect(planLimitMessage(error, en)).toBe(en.billing.readOnlyGroup);
  });

  it("returns null for anything else", () => {
    expect(planLimitMessage(new ApiError(410, "gone"), en)).toBeNull();
  });
});
