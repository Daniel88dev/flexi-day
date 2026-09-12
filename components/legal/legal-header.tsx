"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { LocaleToggle } from "@/components/ui/LocaleToggle";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { useSession } from "@/lib/auth-client";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * Legal pages are public, but a signed-in reader should not lose their way
 * back into the app — they get a link to the dashboard and their user menu,
 * visitors get the marketing header with a sign-in link.
 *
 * While the session is still resolving we render the signed-out header: it is
 * the safe default, and swapping it in afterwards is less jarring than an
 * empty bar.
 */
export function LegalHeader() {
  const { data: session, isPending } = useSession();
  const { t } = useTranslation();
  const signedIn = !isPending && session;

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(14px)",
        borderColor: "var(--border)",
      }}
    >
      <div className="mx-auto flex h-[66px] w-full max-w-6xl items-center gap-4 px-7 max-[600px]:px-5">
        <Logo size={25} href={signedIn ? "/dashboard" : "/"} />
        <div className="flex-1" />
        {signedIn ? (
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard">{t.nav.dashboard}</Link>
            </Button>
            <ModeToggle />
            <LocaleToggle />
            <UserMenu />
          </>
        ) : (
          <>
            <ModeToggle />
            <Button asChild size="sm" variant="outline" className="max-[520px]:hidden">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
