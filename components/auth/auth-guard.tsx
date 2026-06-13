"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      const redirect = encodeURIComponent(pathname || "/");
      router.replace(`/sign-in?redirect=${redirect}`);
    }
  }, [isPending, session, router, pathname]);

  if (isPending || !session) {
    return (
      <div className="text-muted-foreground flex min-h-screen items-center justify-center text-sm">
        <span className="bg-primary mr-2 inline-block size-2 animate-pulse rounded-full" />
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
