"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

/**
 * Sends an already-signed-in visitor to the dashboard. The session lives in a
 * cookie the static export can only read client-side, so this runs in an
 * effect rather than as a redirect at request time.
 */
function useRedirectWhenAuthenticated() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (isPending || !session) return;
    router.replace("/dashboard");
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
  const { session, isPending } = useRedirectWhenAuthenticated();

  if (isPending || session) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center text-sm">
        <span className="bg-primary mr-2 inline-block size-2 animate-pulse rounded-full" />
        Loading…
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
