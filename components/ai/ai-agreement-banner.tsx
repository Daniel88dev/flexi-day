"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pushToast } from "@/components/toast";
import { errorCopy } from "@/lib/api/client";
import { useAcceptAiAgreement, useAiAvailability } from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";
import { AI_AGREEMENT_VERSION, legalHref } from "@/lib/legal";

/**
 * The owner's prompt to accept a raised AI features agreement version, on
 * every page. Nothing pauses while it shows, and it stays hidden where the
 * kill switches leave both AI features dark.
 */
export function AiAgreementBanner() {
  const { t, locale } = useTranslation();
  const copy = t.aiSettings.banner;
  const { data } = useAiAvailability();
  const organization = data?.organizations.find(
    (entry) => entry.newAgreementVersionReady && (entry.assistant || entry.aiConnections)
  );
  const accept = useAcceptAiAgreement(organization?.organizationId ?? null);
  const [error, setError] = useState<string | null>(null);

  if (!organization) return null;

  async function handleAccept() {
    setError(null);
    try {
      await accept.mutateAsync(AI_AGREEMENT_VERSION);
      pushToast(copy.done);
    } catch (err) {
      setError(errorCopy(err, {}, copy.failed));
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1340px] px-7 pt-6 max-md:px-4">
      <div
        role="status"
        className="border-primary/30 bg-primary/5 flex flex-wrap items-center gap-3 rounded-[var(--radius)] border px-4 py-3"
      >
        <FileText className="text-primary h-4 w-4 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{copy.title(AI_AGREEMENT_VERSION)}</p>
          <p className="text-muted-foreground text-xs">{copy.body}</p>
          {error ? <p className="text-destructive mt-1 text-xs">{error}</p> : null}
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={legalHref("ai-agreement", locale)} target="_blank" rel="noopener">
            {copy.read}
          </Link>
        </Button>
        <Button size="sm" disabled={accept.isPending} onClick={() => void handleAccept()}>
          {accept.isPending ? copy.accepting : copy.accept(AI_AGREEMENT_VERSION)}
        </Button>
      </div>
    </div>
  );
}
