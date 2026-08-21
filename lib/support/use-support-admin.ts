"use client";

import { useSession } from "@/lib/auth-client";

/**
 * Whether the signed-in user is on the backend's support allowlist. Read off
 * the session payload the app already fetches (the backend's `customSession`
 * plugin adds the field), so it costs no extra request. The typed better-auth
 * client cannot infer a server-side plugin's field across repos, hence the
 * cast.
 *
 * UI gating only — every `/api/support/*` route re-checks the allowlist
 * server-side.
 */
export function useSupportAdmin(): { supportAdmin: boolean; isPending: boolean } {
  const { data, isPending } = useSession();
  const supportAdmin = (data as { supportAdmin?: boolean } | null)?.supportAdmin === true;
  return { supportAdmin, isPending };
}
