"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { OrganizationBadge } from "@/components/billing/organization-badge";
import { InvitesTab } from "@/components/groups/invites-tab";
import { MembersTab } from "@/components/groups/members-tab";
import { MirroringTab } from "@/components/groups/mirroring-tab";
import { QuotasTab } from "@/components/groups/quotas-tab";
import { SettingsTab } from "@/components/groups/settings-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGroup } from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";

type Tab = "members" | "quotas" | "invites" | "settings" | "mirroring";

const TAB_ORDER: Tab[] = ["members", "quotas", "invites", "settings", "mirroring"];

const ADMIN_ONLY_TABS: Tab[] = ["invites", "settings"];

const isTab = (value: string | null): value is Tab =>
  value !== null && (TAB_ORDER as string[]).includes(value);

export default function GroupDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const search = useSearchParams();
  const groupId = search.get("groupId") ?? "";
  const tabParam = search.get("tab");

  // The group and the caller's rights over it both come from the backend, so an
  // organization admin — who has no membership row at all — sees the same screen
  // as a group admin, and nobody is shown a control the API will refuse.
  const groupQuery = useGroup(groupId);
  const group = groupQuery.data;
  const isAdmin = group?.access.canAdmin ?? false;
  // `viaOrgAdmin` is also true for a plain member whose admin rights come from
  // the organization, and the notice says they are not a member — so it takes
  // both flags.
  const viaOrgAdmin = (group?.access.viaOrgAdmin && !group.access.isMember) ?? false;

  const visibleTabs = TAB_ORDER.filter((tb) => isAdmin || !ADMIN_ONLY_TABS.includes(tb));
  const tab: Tab = isTab(tabParam) && visibleTabs.includes(tabParam) ? tabParam : "members";

  // The URL stays the source of truth so refresh and share keep the open tab.
  function selectTab(next: string) {
    router.replace(`/groups/detail?groupId=${groupId}&tab=${next}`, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs">
            <Link href="/groups" className="hover:text-foreground hover:underline">
              {t.groupDetail.allGroups}
            </Link>
          </p>
          <h1 className="font-heading text-2xl font-bold">
            {group?.groupName ?? t.groupDetail.fallbackName}
          </h1>
          {group ? (
            <p className="text-muted-foreground mt-1 text-sm">
              {t.groupDetail.defaultsSummary(
                group.defaultVacationDays,
                group.defaultHomeOfficeDays
              )}
            </p>
          ) : null}
          <OrganizationBadge organization={group?.organization ?? null} className="mt-2" />
        </div>
      </div>

      {viaOrgAdmin && group?.organization ? (
        <div
          className="flex items-start gap-2.5 rounded-lg px-3.5 py-2.5 text-sm"
          style={{ background: "var(--warm-soft)", color: "var(--text)" }}
        >
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{t.organization.viaOrgAdminNotice(group.organization.name)}</span>
        </div>
      ) : null}

      <Tabs value={tab} onValueChange={selectTab} className="gap-6">
        <TabsList className="h-auto max-w-full flex-wrap">
          {visibleTabs.map((tb) => (
            <TabsTrigger key={tb} value={tb}>
              {t.groupDetail.tabs[tb]}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="members">
          <MembersTab groupId={groupId} isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="quotas">
          <QuotasTab groupId={groupId} group={group} isAdmin={isAdmin} />
        </TabsContent>
        {isAdmin ? (
          <TabsContent value="invites">
            <InvitesTab groupId={groupId} isAdmin={isAdmin} />
          </TabsContent>
        ) : null}
        {isAdmin ? (
          <TabsContent value="settings">
            <SettingsTab group={group} />
          </TabsContent>
        ) : null}
        <TabsContent value="mirroring">
          <MirroringTab groupId={groupId} groupName={group?.groupName} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
