import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/client";
import { en } from "@/lib/i18n/dictionaries/en";
import { cs } from "@/lib/i18n/dictionaries/cs";
import { closedInviteCopy, joinErrorMessage } from "../invite-errors";

const apiError = (status: number, message: string, context?: Record<string, unknown>) =>
  new ApiError(status, message, undefined, [{ message, context }]);

describe("joinErrorMessage", () => {
  it("translates the unverified-address refusal of an invite code", () => {
    const err = apiError(403, "Verify your email address before joining a team", {
      code: "EMAIL_NOT_VERIFIED_USE_INVITE_LINK",
    });

    expect(joinErrorMessage(err, en)).toBe(
      "Use the Join button in your invite email, or confirm your address first."
    );
    expect(joinErrorMessage(err, cs)).toBe(cs.groups.joinUnverified);
    expect(cs.groups.joinUnverified).not.toBe(en.groups.joinUnverified);
  });

  it("says which closed state stopped the invite", () => {
    expect(joinErrorMessage(apiError(410, "gone", { code: "INVITE_EXPIRED" }), en)).toBe(
      `${en.join.expiredTitle}. ${en.join.expired}`
    );
    expect(joinErrorMessage(apiError(410, "gone", { code: "INVITE_USED" }), en)).toBe(
      `${en.join.usedTitle}. ${en.join.used}`
    );
    expect(joinErrorMessage(apiError(410, "gone", { code: "INVITE_REVOKED" }), en)).toBe(
      `${en.join.revokedTitle}. ${en.join.revoked}`
    );
  });

  it("reports an invite for another address, an unknown link and an existing membership", () => {
    expect(joinErrorMessage(apiError(403, "no", { code: "INVITE_EMAIL_MISMATCH" }), en)).toBe(
      en.join.wrongAccountTitle
    );
    expect(joinErrorMessage(apiError(404, "no", { code: "INVITE_NOT_FOUND" }), en)).toBe(
      en.join.notFound
    );
    expect(joinErrorMessage(apiError(409, "no", { code: "ALREADY_MEMBER" }), en)).toBe(
      en.join.alreadyMemberTitle
    );
  });

  it("shows the plan-limit message for a full group", () => {
    const err = apiError(402, "limit", { reason: "PLAN_LIMIT", limit: 10, current: 10 });

    expect(joinErrorMessage(err, en)).toBe(en.billing.memberLimitReached(10));
  });

  it("falls back to the server's message, then to a generic one", () => {
    expect(joinErrorMessage(apiError(404, "Invalid or expired validation code"), en)).toBe(
      "Invalid or expired validation code"
    );
    expect(joinErrorMessage("boom", en)).toBe(en.groups.joinFailed);
  });
});

describe("closedInviteCopy", () => {
  it("returns a title and body for each closed invite state", () => {
    expect(closedInviteCopy(en)).toEqual({
      used: { title: en.join.usedTitle, body: en.join.used },
      expired: { title: en.join.expiredTitle, body: en.join.expired },
      revoked: { title: en.join.revokedTitle, body: en.join.revoked },
    });
  });
});
