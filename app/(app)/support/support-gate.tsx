"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupportAdmin } from "@/lib/support/use-support-admin";

/**
 * Wraps every /support page. Cosmetic only — the backend 404s every
 * /api/support call from a non-allowlisted user regardless — but it keeps a
 * hand-typed /support URL from flashing an empty debug shell at normal users.
 *
 * Owner-only surface, so the copy below stays English and out of the i18n
 * dictionaries on purpose.
 */
export function SupportGate({ children }: { children: React.ReactNode }) {
  const { supportAdmin, isPending } = useSupportAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !supportAdmin) {
      router.replace("/dashboard");
    }
  }, [isPending, supportAdmin, router]);

  if (!supportAdmin) return null;

  return <>{children}</>;
}
