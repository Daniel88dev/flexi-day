"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/nav-bar";
import { useSession } from "@/lib/auth-client";

/**
 * Legal pages are public, but a signed-in reader should not lose their way
 * back into the app — they get the normal app navigation, visitors get the
 * marketing header with a sign-in link.
 *
 * While the session is still resolving we render the signed-out header: it is
 * the safe default, and swapping it in afterwards is less jarring than an
 * empty bar.
 */
export function LegalHeader() {
  const { data: session, isPending } = useSession();

  if (!isPending && session) return <NavBar />;

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
        <Logo size={25} href="/" />
        <div className="flex-1" />
        <ModeToggle />
        <Button asChild size="sm" variant="outline" className="max-[520px]:hidden">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>
    </header>
  );
}
