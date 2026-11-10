"use client";

import { ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDismissPrivacyBanner, usePrivacyBanner } from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";
import { legalHref } from "@/lib/legal";

/**
 * The Privacy Policy update notice for every user, from Day 0 for 30 days. The backend decides
 * whether it shows (AI connections switch, start date, the user's dismissal); nothing is accepted.
 */
export function PrivacyBanner() {
  const { t, locale } = useTranslation();
  const copy = t.privacyBanner;
  const { data } = usePrivacyBanner();
  const dismiss = useDismissPrivacyBanner();

  if (!data?.show) return null;

  return (
    <div className="mx-auto w-full max-w-[1340px] px-7 pt-6 max-md:px-4">
      <div
        role="status"
        className="border-primary/30 bg-primary/5 flex items-center gap-3 rounded-[var(--radius)] border px-4 py-3"
      >
        <ShieldCheck className="text-primary h-4 w-4 shrink-0" aria-hidden />
        <p className="min-w-0 flex-1 text-sm">
          {copy.text}{" "}
          <a
            href={`${legalHref("privacy", locale)}#what-changed`}
            target="_blank"
            rel="noopener"
            className="font-semibold underline underline-offset-2"
            onClick={() => dismiss.mutate()}
          >
            {copy.read}
          </a>
        </p>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0"
          aria-label={copy.dismiss}
          onClick={() => dismiss.mutate()}
        >
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
