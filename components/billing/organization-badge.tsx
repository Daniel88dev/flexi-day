"use client";

import { Building2 } from "lucide-react";
import type { GroupOrganization } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

/**
 * Tells a group's members which organization covers them, and on what plan.
 *
 * A subscription is only worth a badge when there is one: on Free the tone
 * drops to plain muted text, so a real badge stays a signal rather than
 * decoration on every card.
 */
export function OrganizationBadge({
  organization,
  className,
}: {
  organization: GroupOrganization | null;
  className?: string;
}) {
  const { t } = useTranslation();

  if (!organization) return null;

  const label = organization.active
    ? t.organization.planBadge(organization.name, t.billing.planNames[organization.plan])
    : t.organization.freeBadge(organization.name);

  const trialing = organization.status === "trialing";
  // A failing subscription keeps its paid entitlements for the whole grace
  // window, so `active` alone stays true and would say nothing is wrong for
  // days. The status is the only signal that reaches a group's members —
  // `GraceBanner` resolves the org by ownership, so nobody but the owner sees
  // it. Keyed on the status, never on `!active`, which is also how a comped
  // Free override looks.
  const failing =
    organization.status === "past_due" ||
    organization.status === "paused" ||
    organization.status === "canceled";

  return (
    <span
      title={label}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        organization.active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground bg-transparent px-0 font-medium",
        className
      )}
    >
      <Building2 className="h-3 w-3 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
      {trialing ? (
        <span className="shrink-0 opacity-70">{t.billing.statusLabels.trialing}</span>
      ) : null}
      {failing ? (
        <span className="text-destructive shrink-0">
          {organization.active ? t.organization.planIssue : t.organization.planLapsed}
        </span>
      ) : null}
    </span>
  );
}
