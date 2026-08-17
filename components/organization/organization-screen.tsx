"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pushToast } from "@/components/toast";
import {
  useAddOrganizationAdmin,
  useOrganization,
  useOrganizationCandidates,
  useOrganizations,
  useRemoveOrganizationAdmin,
  useUpdateOrganization,
} from "@/lib/api/queries";
import type { OrganizationDetail } from "@/lib/api/organization";
import { AvatarBubble } from "@/components/brand/avatar-bubble";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

export function OrganizationScreen() {
  const { t } = useTranslation();
  const organizationsQuery = useOrganizations();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const organizations = organizationsQuery.data ?? [];
  // Owned organizations sort first, so the default is the viewer's own.
  const activeId = selectedId ?? organizations[0]?.id ?? null;
  const detailQuery = useOrganization(activeId);

  if (organizationsQuery.isLoading) {
    return <p className="text-muted-foreground text-sm">{t.common.loading}</p>;
  }

  // Checked before the empty case: a failed request is not the same as owning
  // no organization, and inviting an existing owner to "create your first
  // group" would have them create a duplicate.
  if (organizationsQuery.error) {
    return (
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">{t.organization.title}</h1>
        <p className="text-destructive text-sm">{t.organization.loadError}</p>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">{t.organization.title}</h1>
        <p className="text-muted-foreground text-sm">{t.organization.none}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">{t.organization.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t.organization.subtitle}</p>
      </div>

      {organizations.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-xs font-semibold uppercase">
            {t.organization.switcher}
          </span>
          {organizations.map((organization) => (
            <button
              key={organization.id}
              type="button"
              onClick={() => setSelectedId(organization.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                organization.id === activeId
                  ? "border-primary text-primary bg-primary/5"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {organization.name}
              {organization.isOwner ? (
                <span className="ml-1.5 text-[10px] uppercase opacity-70">
                  {t.organization.ownerTag}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {detailQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">{t.common.loading}</p>
      ) : detailQuery.error || !detailQuery.data ? (
        <p className="text-destructive text-sm">{t.organization.loadError}</p>
      ) : (
        // Keyed on the organization: the cards seed `useState` from the detail,
        // so a switch into an already-cached organization would otherwise reuse
        // the instance and carry the previous name into its Save.
        <OrganizationDetailView
          key={activeId}
          detail={detailQuery.data}
          organizationId={activeId}
        />
      )}
    </div>
  );
}

function OrganizationDetailView({
  detail,
  organizationId,
}: {
  detail: OrganizationDetail;
  organizationId: string | null;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <DetailsCard detail={detail} organizationId={organizationId} />
        <PlanCard detail={detail} />
      </div>
      <GroupsCard detail={detail} />
      <AdminsCard detail={detail} organizationId={organizationId} />
    </div>
  );
}

function DetailsCard({
  detail,
  organizationId,
}: {
  detail: OrganizationDetail;
  organizationId: string | null;
}) {
  const { t } = useTranslation();
  const update = useUpdateOrganization(organizationId);
  const { isOwner } = detail.organization;

  const [name, setName] = useState(detail.organization.name);
  const [billingEmail, setBillingEmail] = useState(detail.organization.billingEmail ?? "");
  const [error, setError] = useState<string | null>(null);

  // Compared against the same normalised value the payload uses, so a rename
  // alone never also ships an empty billingEmail.
  const storedBillingEmail = detail.organization.billingEmail ?? "";
  const billingEmailChanged = isOwner && billingEmail !== storedBillingEmail;
  const dirty = name !== detail.organization.name || billingEmailChanged;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await update.mutateAsync({
        ...(name !== detail.organization.name ? { name } : {}),
        ...(billingEmailChanged ? { billingEmail } : {}),
      });
      pushToast(t.organization.saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.organization.saveFailed);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-4 w-4" aria-hidden />
          {t.organization.detailsTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="orgName">{t.organization.nameLabel}</Label>
            <Input
              id="orgName"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {/* Null for a delegated admin — the billing address is owner-only. */}
          {isOwner ? (
            <div className="space-y-1.5">
              <Label htmlFor="orgBillingEmail">{t.organization.billingEmailLabel}</Label>
              <Input
                id="orgBillingEmail"
                type="email"
                required
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">{t.organization.billingEmailHint}</p>
            </div>
          ) : null}
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <Button type="submit" disabled={!dirty || update.isPending || !name.trim()}>
            {update.isPending ? t.organization.saving : t.organization.save}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PlanCard({ detail }: { detail: OrganizationDetail }) {
  const { t } = useTranslation();
  const { plan } = detail;
  const used = detail.groups.length;
  const ratio = plan.maxGroups > 0 ? Math.min(1, used / plan.maxGroups) : 0;
  const atCap = used >= plan.maxGroups;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.organization.planTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-heading text-xl font-bold">
            {t.billing.planNames[plan.plan] ?? plan.plan}
          </span>
          {plan.status ? (
            <span className="text-muted-foreground text-xs">
              {t.billing.statusLabels[plan.status] ?? plan.status}
            </span>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">
          {t.organization.planLimits(plan.maxGroups, plan.maxMembersPerGroup)}
        </p>

        <div className="space-y-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm">{t.billing.usageTitle}</span>
            <span
              className={cn(
                "text-xs tabular-nums",
                atCap ? "text-destructive font-semibold" : "text-muted-foreground"
              )}
            >
              {used} / {plan.maxGroups}
            </span>
          </div>
          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
            <div
              className={cn("h-full rounded-full", atCap ? "bg-destructive" : "bg-primary")}
              style={{ width: `${(ratio * 100).toFixed(1)}%` }}
            />
          </div>
        </div>

        {/* Subscription management stays on the billing screen, which resolves
            the organization by ownership — so only the owner is sent there. */}
        {detail.organization.isOwner ? (
          <Button asChild size="sm" variant="outline">
            <Link href="/billing">{t.organization.manageBilling}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function GroupsCard({ detail }: { detail: OrganizationDetail }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4" aria-hidden />
          {t.organization.groupsTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {detail.groups.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t.organization.groupsNone}</p>
        ) : (
          <ul className="divide-border divide-y">
            {detail.groups.map((group) => (
              <li key={group.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate font-medium">{group.groupName}</div>
                  <div className="text-muted-foreground text-xs">
                    {t.organization.groupMembers(group.members)}
                    {" · "}
                    {new Date(group.createdAt).toLocaleDateString(t.common.dateLocale)}
                  </div>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/groups/detail?groupId=${group.id}`}>
                    {t.organization.openGroup}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function AdminsCard({
  detail,
  organizationId,
}: {
  detail: OrganizationDetail;
  organizationId: string | null;
}) {
  const { t } = useTranslation();
  const { isOwner } = detail.organization;

  // Owner-only endpoint; asking as a delegated admin would only 403.
  const candidatesQuery = useOrganizationCandidates(organizationId, isOwner);
  const addAdmin = useAddOrganizationAdmin(organizationId);
  const removeAdmin = useRemoveOrganizationAdmin(organizationId);

  const [selected, setSelected] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Per-row so one removal does not disable every other row's button.
  const [removingId, setRemovingId] = useState<string | null>(null);

  const candidates = candidatesQuery.data ?? [];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError(null);
    try {
      await addAdmin.mutateAsync(selected);
      setSelected("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.organization.addFailed);
    }
  }

  async function handleRemove(userId: string) {
    setError(null);
    setRemovingId(userId);
    try {
      await removeAdmin.mutateAsync(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.organization.removeFailed);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          {t.organization.adminsTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">{t.organization.adminsHint}</p>

        <ul className="divide-border divide-y">
          {detail.admins.map((admin) => (
            <li key={admin.userId} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <AvatarBubble
                  initials={admin.user.initials}
                  background={admin.user.avatarColor}
                  name={admin.user.name}
                  size={30}
                />
                <div className="min-w-0">
                  <div className="truncate font-medium">{admin.user.name}</div>
                  <div className="text-muted-foreground truncate text-xs">{admin.email}</div>
                </div>
              </div>
              {admin.isOwner ? (
                <span className="bg-primary/10 text-primary shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                  {t.organization.ownerTag}
                </span>
              ) : isOwner ? (
                <Button
                  size="xs"
                  variant="outline"
                  className="text-destructive"
                  disabled={removingId === admin.userId}
                  onClick={() => void handleRemove(admin.userId)}
                >
                  {removingId === admin.userId ? t.organization.removing : t.organization.remove}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        {!isOwner ? (
          <p className="text-muted-foreground text-xs">{t.organization.adminsOwnerOnly}</p>
        ) : candidatesQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">{t.common.loading}</p>
        ) : candidates.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t.organization.noCandidates}</p>
        ) : (
          <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
            <div className="min-w-[220px] flex-1 space-y-1.5">
              <Label htmlFor="adminCandidate">{t.organization.addAdmin}</Label>
              {/* A plain select: the candidate list is short and comes from the
                  organization's own people, so it needs no search. */}
              <select
                id="adminCandidate"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="border-border bg-background h-9 w-full rounded-md border px-3 text-sm"
              >
                <option value="">{t.organization.addAdminPlaceholder}</option>
                {candidates.map((candidate) => (
                  <option key={candidate.userId} value={candidate.userId}>
                    {candidate.user.name} —{" "}
                    {t.organization.candidateGroups(candidate.groupNames.join(", "))}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={!selected || addAdmin.isPending}>
              {addAdmin.isPending ? t.organization.adding : t.organization.addAdmin}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
