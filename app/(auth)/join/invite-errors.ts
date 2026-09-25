import { ApiError } from "@/lib/api/client";
import type { InviteStatus } from "@/lib/api/types";

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
