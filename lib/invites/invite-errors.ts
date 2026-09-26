import { ApiError } from "@/lib/api/client";
import type { InviteStatus } from "@/lib/api/types";
import { planLimitMessage } from "@/lib/billing/plan-limit-error";
import type { Dictionary } from "@/lib/i18n";

export type ClosedStatus = Exclude<InviteStatus, "open">;

const CLOSED_STATUS_BY_CODE: Record<string, ClosedStatus> = {
  INVITE_USED: "used",
  INVITE_EXPIRED: "expired",
  INVITE_REVOKED: "revoked",
};

export const errorCode = (error: unknown): string | undefined =>
  error instanceof ApiError ? error.context<{ code?: string }>()?.code : undefined;

/** The invite state behind a redemption's 410 error code, if it is one. */
export const closedStatusOf = (code: string | undefined): ClosedStatus | undefined =>
  code ? CLOSED_STATUS_BY_CODE[code] : undefined;

export const closedInviteCopy = (
  t: Dictionary
): Record<ClosedStatus, { title: string; body: string }> => ({
  used: { title: t.join.usedTitle, body: t.join.used },
  expired: { title: t.join.expiredTitle, body: t.join.expired },
  revoked: { title: t.join.revokedTitle, body: t.join.revoked },
});

/** The translated reason a join by invite link or invite code was refused. */
export function joinErrorMessage(error: unknown, t: Dictionary): string {
  const code = errorCode(error);
  if (code === "EMAIL_NOT_VERIFIED_USE_INVITE_LINK") return t.groups.joinUnverified;
  if (code === "INVITE_EMAIL_MISMATCH") return t.join.wrongAccountTitle;
  if (code === "INVITE_NOT_FOUND") return t.join.notFound;
  if (code === "ALREADY_MEMBER") return t.join.alreadyMemberTitle;

  const closed = closedStatusOf(code);
  if (closed) {
    const { title, body } = closedInviteCopy(t)[closed];
    return `${title}. ${body}`;
  }

  return (
    planLimitMessage(error, t) ?? (error instanceof Error ? error.message : t.groups.joinFailed)
  );
}
