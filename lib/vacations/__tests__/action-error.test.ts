import { describe, expect, it } from "vitest";
import { vacationActionErrorMessage } from "../action-error";
import { ApiError } from "@/lib/api/client";
import { en } from "@/lib/i18n/dictionaries/en";
import { cs } from "@/lib/i18n/dictionaries/cs";

const conflict = (message: string) => new ApiError(409, message);

describe("vacationActionErrorMessage", () => {
  it("translates a cancel conflict instead of echoing the backend's English", () => {
    const error = conflict("One or more of these requests has already been cancelled");

    expect(vacationActionErrorMessage(error, "cancel", en)).toBe(
      en.vacationDetail.alreadyCancelled
    );
    expect(vacationActionErrorMessage(error, "cancel", cs)).toBe(
      cs.vacationDetail.alreadyCancelled
    );
  });

  it("keeps the backend message for a conflict on any other action", () => {
    const error = conflict("This request has already been decided");

    expect(vacationActionErrorMessage(error, "approve", en)).toBe(
      "This request has already been decided"
    );
    expect(vacationActionErrorMessage(error, "reject", en)).toBe(
      "This request has already been decided"
    );
  });

  it("keeps the backend message for a cancel that failed some other way", () => {
    const error = new ApiError(403, "You cannot cancel this request");

    expect(vacationActionErrorMessage(error, "cancel", en)).toBe("You cannot cancel this request");
  });

  it("falls back to the generic failure for a non-Error rejection", () => {
    expect(vacationActionErrorMessage("boom", "cancel", en)).toBe(en.vacationDetail.actionFailed);
    expect(vacationActionErrorMessage(new Error(""), "approve", en)).toBe(
      en.vacationDetail.actionFailed
    );
  });
});
