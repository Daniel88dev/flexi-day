"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { useCreateGroup, useGroups, useJoinGroup, useSubscription } from "@/lib/api/queries";
import { planLimitFromError } from "@/lib/billing/plan-limit-error";
import { useSession } from "@/lib/auth-client";
import { useTranslation } from "@/lib/i18n/use-translation";

export default function GroupsPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const groupsQuery = useGroups();
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();
  const billingQuery = useSubscription();

  // `useSubscription` describes the viewer's OWN organization. Someone who
  // only administers a group inside another owner's org gets Free entitlements
  // and zero usage from it, so the cap UI would be flatly wrong for them — only
  // show it when the viewer actually owns an organization.
  const billing = billingQuery.data?.organization ? billingQuery.data : undefined;
  const atGroupCap = billing ? billing.usage.groupsUsed >= billing.entitlements.maxGroups : false;

  const [groupName, setGroupName] = useState("");
  const [defaultVacation, setDefaultVacation] = useState<number | "">(20);
  const [defaultHomeOffice, setDefaultHomeOffice] = useState<number | "">(60);
  const [createError, setCreateError] = useState<{
    message: string;
    isPlanLimit: boolean;
  } | null>(null);

  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    try {
      await createGroup.mutateAsync({
        groupName,
        defaultVacation: typeof defaultVacation === "number" ? defaultVacation : undefined,
        defaultHomeOffice: typeof defaultHomeOffice === "number" ? defaultHomeOffice : undefined,
      });
      setGroupName("");
    } catch (err) {
      // A 402 carries the real limits — render the translated prompt rather
      // than the backend's English message.
      const planLimit = planLimitFromError(err);
      setCreateError(
        planLimit
          ? { message: t.billing.groupLimitReached(planLimit.limit), isPlanLimit: true }
          : {
              message: err instanceof Error ? err.message : t.groups.createFailed,
              isPlanLimit: false,
            }
      );
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoinError(null);
    setJoinSuccess(null);
    try {
      await joinGroup.mutateAsync(joinCode.trim());
      setJoinSuccess(t.groups.joinSuccess);
      setJoinCode("");
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : t.groups.joinFailed);
    }
  }

  const groups = groupsQuery.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">{t.groups.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t.groups.subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.groups.createTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="groupName">{t.groups.nameLabel}</Label>
                <Input
                  id="groupName"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder={t.groups.namePlaceholder}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dv">{t.groups.defaultVacation}</Label>
                  <Input
                    id="dv"
                    type="number"
                    min={0}
                    max={99}
                    value={defaultVacation}
                    onChange={(e) =>
                      setDefaultVacation(e.target.value === "" ? "" : Number(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dh">{t.groups.defaultHomeOffice}</Label>
                  <Input
                    id="dh"
                    type="number"
                    min={0}
                    max={99}
                    value={defaultHomeOffice}
                    onChange={(e) =>
                      setDefaultHomeOffice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                  />
                </div>
              </div>
              {createError ? (
                <p className="text-destructive flex flex-wrap items-center gap-2 text-sm">
                  <span>{createError.message}</span>
                  {createError.isPlanLimit ? (
                    <Link href="/billing" className="text-primary font-semibold underline">
                      {t.billing.upgrade}
                    </Link>
                  ) : null}
                </p>
              ) : null}
              {billing ? (
                <p className="text-muted-foreground text-xs">
                  {t.billing.groupsUsed(billing.usage.groupsUsed, billing.entitlements.maxGroups)}
                </p>
              ) : null}
              {atGroupCap ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="submit" disabled>
                    {t.groups.create}
                  </Button>
                  <Button asChild size="sm" variant="outline" className="gap-1.5">
                    <Link href="/billing">
                      <Sparkles className="h-3.5 w-3.5" />
                      {t.billing.upgrade}
                    </Link>
                  </Button>
                </div>
              ) : (
                <Button type="submit" disabled={createGroup.isPending || !groupName}>
                  {createGroup.isPending ? t.groups.creating : t.groups.create}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.groups.joinTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="code">{t.groups.inviteCode}</Label>
                <Input
                  id="code"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder={t.groups.invitePlaceholder}
                />
                <p className="text-muted-foreground text-xs">{t.groups.inviteHint}</p>
              </div>
              {joinError ? <p className="text-destructive text-sm">{joinError}</p> : null}
              {joinSuccess ? (
                <p className="text-sm text-green-700 dark:text-green-400">{joinSuccess}</p>
              ) : null}
              <Button type="submit" variant="outline" disabled={joinGroup.isPending || !joinCode}>
                {joinGroup.isPending ? t.groups.joining : t.groups.join}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">{t.groups.yourGroups}</h2>
        {groupsQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">{t.common.loading}</p>
        ) : groups.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t.groups.none}</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {groups.map((g) => (
              <Card key={g.id}>
                <CardContent className="space-y-2 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-heading text-base font-semibold">{g.groupName}</div>
                      <div className="text-muted-foreground text-xs">
                        {t.groups.defaultsSummary(g.defaultVacationDays, g.defaultHomeOfficeDays)}
                      </div>
                    </div>
                    {g.managerUserId === userId ? (
                      <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                        {t.groups.manager}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/groups/detail?groupId=${g.id}`}>{t.groups.members}</Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/groups/detail?groupId=${g.id}&tab=quotas`}>
                        {t.groups.quotas}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
