"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useSubscription } from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * App-wide strip shown while a subscription is in its grace window, or once
 * it has lapsed into read-only. Renders nothing for healthy accounts.
 */
export function GraceBanner() {
  const { t } = useTranslation();
  const { data } = useSubscription();

  if (!data) return null;
  const { graceEndsAt, writable } = data.entitlements;
  if (!graceEndsAt && writable) return null;

  const message = graceEndsAt
    ? t.billing.graceBanner(
        new Date(graceEndsAt).toLocaleDateString(t.common.dateLocale, {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      )
    : t.billing.readOnlyBanner;

  return (
    <div
      className="flex items-center justify-center gap-3 px-4 py-2 text-center text-sm"
      style={
        graceEndsAt
          ? { background: "var(--warm-soft)", color: "var(--text)" }
          : { background: "var(--destructive)", color: "var(--primary-fg)" }
      }
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
      <Link href="/billing" className="font-semibold underline underline-offset-2">
        {t.billing.graceBannerCta}
      </Link>
    </div>
  );
}
