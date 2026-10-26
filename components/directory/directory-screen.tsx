"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NavBadge } from "@/components/shell/nav-badge";
import { DirectoryList } from "@/components/directory/directory-list";
import type { DirectoryOrganization } from "@/lib/api/directory";
import { useDirectoryOrganizations } from "@/lib/api/queries";
import { directoryHome } from "@/lib/directory/directory-access";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * The directory page: the list of the Directory organization the link names,
 * else the first one. Owners and org admins of an organization without it get
 * the upsell, or a pointer to the Organization page on Enterprise.
 */
export function DirectoryScreen() {
  const { t } = useTranslation();
  const organizations = useDirectoryOrganizations();
  const linkedId = useSearchParams().get("organizationId");
  const [chosen, setChosen] = useState<string | null>(null);

  if (organizations.isLoading) {
    return <p className="text-muted-foreground text-sm">{t.common.loading}</p>;
  }
  if (organizations.error || !organizations.data) {
    return <p className="text-destructive text-sm">{t.directory.loadFailed}</p>;
  }

  const home = directoryHome(organizations.data);
  if (!home) {
    return (
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">{t.directory.title}</h1>
        <p className="text-muted-foreground text-sm">{t.directory.unavailable}</p>
      </div>
    );
  }
  if (home.enabled) {
    const enabled = organizations.data.filter((organization) => organization.enabled);
    const current =
      enabled.find((organization) => organization.organizationId === (chosen ?? linkedId)) ?? home;
    return <DirectoryList organization={current} organizations={enabled} onSelect={setChosen} />;
  }
  if (!home.writable) return <DirectoryUpsell />;
  return <DirectoryOff organization={home} />;
}

function DirectoryUpsell() {
  const { t } = useTranslation();
  return (
    <Card className="max-w-3xl">
      <CardContent className="space-y-4 py-6">
        <NavBadge className="ml-0">{t.nav.enterpriseChip}</NavBadge>
        <h1 className="font-heading text-2xl font-bold">{t.directory.title}</h1>
        <p className="text-muted-foreground">{t.directory.upsellLead}</p>
        <ul className="space-y-2 text-sm">
          {t.directory.upsellPoints.map((point) => (
            <li key={point} className="flex items-start gap-2">
              <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {point}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href="/billing">{t.directory.seePlans}</Link>
          </Button>
          <span className="text-muted-foreground text-xs">{t.directory.planNote}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function DirectoryOff({ organization }: { organization: DirectoryOrganization }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">{t.directory.title}</h1>
      <p className="text-muted-foreground text-sm">
        {organization.role === "OWNER"
          ? t.directory.offOwner
          : t.directory.offAdmin(organization.name)}
      </p>
      <Button asChild variant="outline">
        <Link href={`/organization?organizationId=${organization.organizationId}`}>
          {t.directory.toOrganization}
        </Link>
      </Button>
    </div>
  );
}
