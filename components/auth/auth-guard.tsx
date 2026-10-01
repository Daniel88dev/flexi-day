"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useTranslation } from "@/lib/i18n/use-translation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      // The query string comes along so a direct link such as
      // `/settings/?delete-account` survives the sign-in.
      const redirect = encodeURIComponent((pathname || "/") + window.location.search);
      router.replace(`/sign-in?redirect=${redirect}`);
    }
  }, [isPending, session, router, pathname]);

  if (isPending || !session) {
    return (
      <div className="text-muted-foreground flex min-h-screen items-center justify-center text-sm">
        <span className="bg-primary mr-2 inline-block size-2 animate-pulse rounded-full" />
        {t.auth.loading}
      </div>
    );
  }

  return <>{children}</>;
}
