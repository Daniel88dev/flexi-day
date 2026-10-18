"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { safeRedirect } from "@/lib/auth/safe-redirect";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * Sends an already-signed-in visitor on to their `redirect`, or the dashboard.
 * The session lives in a cookie the static export can only read client-side,
 * so this runs in an effect rather than as a redirect at request time. It also
 * fires the moment a sign-in succeeds, so it must honour the same `redirect`
 * the sign-in form does or it wins the race and drops it.
 */
function useRedirectWhenAuthenticated() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (isPending || !session) return;
    router.replace(safeRedirect(new URLSearchParams(window.location.search).get("redirect")));
  }, [isPending, session, router]);

  return { session, isPending };
}

/**
 * Wraps pages that only make sense signed out (sign in, sign up, forgot
 * password): holds the content back until the session is known, so a signed-in
 * user never sees a sign-in form flash before the redirect.
 *
 * Deliberately not used on mid-flow auth pages (verify email, reset password),
 * which a signed-in user can legitimately land on.
 */
export function GuestGuard({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { session, isPending } = useRedirectWhenAuthenticated();
  // better-auth marks a signed-out session pending again on every refetch (after sign-up, on
  // window focus). Once the page has shown, only a session may hide it, or it remounts blank.
  const [hasShown, setHasShown] = useState(false);
  const hidden = Boolean(session) || (isPending && !hasShown);
  if (!hidden && !hasShown) setHasShown(true);

  if (hidden) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center text-sm">
        <span className="bg-primary mr-2 inline-block size-2 animate-pulse rounded-full" />
        {t.auth.loading}
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Same redirect without blocking the render — for the marketing page, which
 * should stay instantly visible (and statically renderable) for visitors.
 */
export function GuestRedirect() {
  useRedirectWhenAuthenticated();
  return null;
}
