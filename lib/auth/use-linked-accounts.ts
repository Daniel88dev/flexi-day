"use client";

import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

/** Shared so the settings cards issue one request between them, not two. */
export const linkedAccountsKey = ["auth", "accounts"];

/**
 * better-auth's row for an email/password sign-in. A user who only ever signed
 * in with Google or Microsoft has no such row and therefore no password —
 * `changePassword` answers `CREDENTIAL_ACCOUNT_NOT_FOUND` for them.
 */
export const PASSWORD_PROVIDER_ID = "credential";

/** Every sign-in method attached to the signed-in user. */
export function useLinkedAccounts() {
  return useQuery({
    queryKey: linkedAccountsKey,
    queryFn: async () => {
      const { data, error } = await authClient.listAccounts();
      // Diagnostic only: callers render their own translated copy on failure.
      if (error) throw new Error(error.message ?? "list-accounts failed");
      return data ?? [];
    },
  });
}

/** Whether the user can sign in with a password — `undefined` until known. */
export function hasPasswordAccount(
  accounts: { providerId: string }[] | undefined
): boolean | undefined {
  if (!accounts) return undefined;
  return accounts.some((account) => account.providerId === PASSWORD_PROVIDER_ID);
}

/**
 * Whether to offer the change-password form. Hidden only when we know there is
 * no password to change: a failed lookup must not take the form away from
 * someone who has one — better-auth rejects the attempt harmlessly, whereas a
 * missing form leaves them with no way to act and no explanation.
 */
export function shouldOfferPasswordChange(query: {
  data: { providerId: string }[] | undefined;
  isError: boolean;
}): boolean {
  if (query.isError) return true;
  return hasPasswordAccount(query.data) === true;
}
