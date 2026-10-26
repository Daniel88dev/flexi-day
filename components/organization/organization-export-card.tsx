"use client";

import { useEffect, useId, useRef } from "react";
import { FileArchive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PersonExportAction } from "@/components/person-export-action";
import { useOrganizationExport, useRequestOrganizationExport } from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";

/** The delete dialog links here, so this anchor is a contract. */
export const ORGANIZATION_EXPORT_ANCHOR = "organization-export";

/** The owner's export of everything the organization holds. Renders nothing for anyone else. */
export function OrganizationExportCard({
  organizationId,
  isOwner,
}: {
  organizationId: string | null;
  isOwner: boolean;
}) {
  const { t } = useTranslation();
  const copy = t.organization.export;
  const titleId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const latest = useOrganizationExport(organizationId, isOwner);
  const request = useRequestOrganizationExport(organizationId);

  // The card mounts after the organization loads, too late for the browser's own jump to the hash.
  useEffect(() => {
    if (isOwner && window.location.hash === `#${ORGANIZATION_EXPORT_ANCHOR}`) {
      cardRef.current?.scrollIntoView?.({ block: "start" });
    }
  }, [isOwner]);

  if (!isOwner) return null;

  return (
    <Card ref={cardRef} id={ORGANIZATION_EXPORT_ANCHOR} role="region" aria-labelledby={titleId}>
      <CardHeader>
        <CardTitle id={titleId} className="flex items-center gap-2">
          <FileArchive className="h-4 w-4" aria-hidden />
          {copy.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-sm">{copy.lead}</p>
        <PersonExportAction
          entry={latest.data}
          labels={{ export: copy.exportLabel, download: copy.downloadLabel }}
          requesting={request.isPending}
          onRequest={() => request.mutateAsync()}
        />
      </CardContent>
    </Card>
  );
}
