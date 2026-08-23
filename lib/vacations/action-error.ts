import { ApiError } from "@/lib/api/client";
import type { Dictionary } from "@/lib/i18n";

export type VacationAction = "approve" | "reject" | "cancel" | "comment";

/**
 * A 409 on cancel means someone else cancelled the same request between the
 * load and the write. It is the one request-action conflict an ordinary user
 * can reach, so it gets a translated message rather than the backend's English.
 */
export function vacationActionErrorMessage(
  error: unknown,
  action: VacationAction,
  t: Dictionary
): string {
  if (action === "cancel" && error instanceof ApiError && error.status === 409) {
    return t.vacationDetail.alreadyCancelled;
  }
  if (error instanceof Error && error.message) return error.message;
  return t.vacationDetail.actionFailed;
}
