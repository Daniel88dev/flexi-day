import { ApiError, api } from "./client";
import type { UUID } from "./types";

export type DeletionBlocker =
  | { kind: "GROUP_HAS_MEMBERS"; groupId: UUID; groupName: string; otherMembers: number }
  | {
      kind: "ORGANIZATION_HAS_MEMBERS";
      organizationId: UUID;
      organizationName: string;
      otherMembers: number;
    }
  | { kind: "SUBSCRIPTION_RENEWING"; organizationId: UUID; organizationName: string }
  | { kind: "SUPPORT_ADMIN" };

export type DeletionConfirmation = "password" | "recent-sign-in";

export type AccountDeletionStatus = {
  canDelete: boolean;
  blockers: DeletionBlocker[];
  confirmation: DeletionConfirmation;
};

export type DeletionRefusal = "PASSWORD_INVALID" | "REAUTH_REQUIRED" | "DELETION_BLOCKED";

/** Mirrors the backend's fresh-session age for a social-only delete. */
export const FRESH_SIGN_IN_MS = 24 * 60 * 60 * 1000;

export function getAccountDeletionStatus(): Promise<AccountDeletionStatus> {
  return api<AccountDeletionStatus>(`/api/users/me/deletion`);
}

export function deleteMyAccount(password?: string): Promise<void> {
  return api<void>(`/api/users/me/delete`, {
    method: "POST",
    body: password === undefined ? {} : { password },
  });
}

export function deletionRefusal(err: unknown): DeletionRefusal | null {
  if (!(err instanceof ApiError)) return null;
  const reason = err.context<{ reason?: unknown }>()?.reason;
  if (err.status === 403 && (reason === "PASSWORD_INVALID" || reason === "REAUTH_REQUIRED")) {
    return reason;
  }
  if (err.status === 409 && reason === "DELETION_BLOCKED") return reason;
  return null;
}
