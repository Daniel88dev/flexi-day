"use client";

import Link from "next/link";
import { Check, Contact } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NavBadge } from "@/components/shell/nav-badge";
import { DirectoryAgreementBanner } from "@/components/directory/directory-agreement-banner";
import type { DirectoryOrganization } from "@/lib/api/directory";
import { useDirectoryOrganizations } from "@/lib/api/queries";
import { directoryHome } from "@/lib/directory/directory-access";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * The directory page. Empty for now in a Directory organization; later
 * tickets fill it. Owners and org admins of an organization without it get
 * the upsell, or a pointer to the Organization page on Enterprise.
 */
export function DirectoryScreen() {
  const { t } = useTranslation();
  const organizations = useDirectoryOrganizations();

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
  if (home.enabled) return <EnabledDirectory organization={home} />;
  if (!home.writable) return <DirectoryUpsell />;
  return <DirectoryOff organization={home} />;
}

function EnabledDirectory({ organization }: { organization: DirectoryOrganization }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t.directory.title}</h1>
      {organization.role === "OWNER" ? (
        <DirectoryAgreementBanner organizationId={organization.organizationId} />
      ) : null}
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <Contact className="text-muted-foreground h-8 w-8" aria-hidden />
          <p className="font-semibold">{t.directory.emptyTitle}</p>
          <p className="text-muted-foreground max-w-md text-sm">
            {t.directory.emptyBody(organization.name)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
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
