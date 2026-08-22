"use client";

import Link from "next/link";
import { CalendarRange, ChevronRight, Mail, Settings2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OrganizationBadge } from "@/components/billing/organization-badge";
import type { GroupListItem } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * One group on the list page. The whole card navigates (stretched link over
 * the card), while the footer buttons deep-link into a specific tab — they sit
 * above the overlay via `relative`. The role badge reflects the caller's real
 * standing: manager first, then their membership flags, so an admin who did
 * not create the group is labeled too.
 */
export function GroupCard({ group, userId }: { group: GroupListItem; userId?: string }) {
  const { t } = useTranslation();

  const isManager = userId !== undefined && group.managerUserId === userId;
  // Optional reads: the backend deploys independently and may not send these yet.
  const isAdmin = isManager || (group.membership?.adminAccess ?? false);
  const role = isManager
    ? t.groups.manager
    : group.membership?.adminAccess
      ? t.groups.admin
      : group.membership?.approverAccess
        ? t.groups.approver
        : null;

  const href = (tab?: string) => `/groups/detail?groupId=${group.id}${tab ? `&tab=${tab}` : ""}`;

  return (
    <Card className="group/card hover:ring-primary/40 relative transition-[box-shadow,translate] hover:-translate-y-px hover:shadow-md">
      <CardContent className="flex h-full flex-col gap-4 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <Link
              href={href()}
              className="font-heading focus-visible:after:ring-ring/50 text-base font-semibold after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-[3px]"
            >
              {group.groupName}
            </Link>
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 text-xs">
              {group.memberCount !== undefined ? (
                <>
                  <Users className="size-3.5 shrink-0" aria-hidden />
                  <span className="text-foreground font-medium">
                    {t.groups.memberCount(group.memberCount)}
                  </span>
                  <span aria-hidden>·</span>
                </>
              ) : null}
              <span>
                {t.groups.defaultsSummary(group.defaultVacationDays, group.defaultHomeOfficeDays)}
              </span>
            </div>
            <OrganizationBadge organization={group.organization} className="mt-1.5" />
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {role ? (
              <Badge className="bg-primary/10 text-primary uppercase" variant="outline">
                {role}
              </Badge>
            ) : null}
            <ChevronRight
              className="text-muted-foreground size-4 transition-transform group-hover/card:translate-x-0.5"
              aria-hidden
            />
          </div>
        </div>

        <div className="relative mt-auto flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={href()}>
              <Users data-icon="inline-start" />
              {t.groups.members}
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={href("quotas")}>
              <CalendarRange data-icon="inline-start" />
              {t.groups.quotas}
            </Link>
          </Button>
          {isAdmin ? (
            <>
              <Button asChild size="sm" variant="outline">
                <Link href={href("invites")}>
                  <Mail data-icon="inline-start" />
                  {t.groups.invites}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={href("settings")}>
                  <Settings2 data-icon="inline-start" />
                  {t.groups.settings}
                </Link>
              </Button>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
