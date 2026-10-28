"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pushToast } from "@/components/toast";
import { errorCopy } from "@/lib/api/client";
import { useAcceptDirectoryAgreement, useDirectoryState } from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";
import { legalHref } from "@/lib/legal";

/**
 * The owner's prompt to accept a new agreement version. Renders nothing for
 * anyone else, and nothing pauses while it shows.
 */
export function DirectoryAgreementBanner({ organizationId }: { organizationId: string | null }) {
  const { t, locale } = useTranslation();
  const copy = t.organization.directory.banner;
  const state = useDirectoryState(organizationId);
  const accept = useAcceptDirectoryAgreement(organizationId);
  const [error, setError] = useState<string | null>(null);

  const data = state.data;
  if (!data?.isOwner || !data.agreement.newVersionReady) return null;
  const version = data.agreement.currentVersion;

  async function handleAccept() {
    setError(null);
    try {
      await accept.mutateAsync(version);
      pushToast(copy.done);
    } catch (err) {
      setError(errorCopy(err, {}, copy.failed));
    }
  }

  return (
    <div
      role="status"
      className="border-primary/30 bg-primary/5 flex flex-wrap items-center gap-3 rounded-[var(--radius)] border px-4 py-3"
    >
      <FileText className="text-primary h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{copy.title(version)}</p>
        <p className="text-muted-foreground text-xs">{copy.body}</p>
        {error ? <p className="text-destructive mt-1 text-xs">{error}</p> : null}
      </div>
      <Button asChild size="sm" variant="outline">
        <Link href={legalHref("directory-agreement", locale)} target="_blank" rel="noopener">
          {copy.read}
        </Link>
      </Button>
      <Button size="sm" disabled={accept.isPending} onClick={() => void handleAccept()}>
        {accept.isPending ? copy.accepting : copy.accept(version)}
      </Button>
    </div>
  );
}
