"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateGroup, useGroups, useJoinGroup } from "@/lib/api/queries";
import { useSession } from "@/lib/auth-client";
import { useTranslation } from "@/lib/i18n/use-translation";

export default function GroupsPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const groupsQuery = useGroups();
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();

  const [groupName, setGroupName] = useState("");
  const [defaultVacation, setDefaultVacation] = useState<number | "">(20);
  const [defaultHomeOffice, setDefaultHomeOffice] = useState<number | "">(60);
  const [createError, setCreateError] = useState<string | null>(null);

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
      setCreateError(err instanceof Error ? err.message : t.groups.createFailed);
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
              {createError ? <p className="text-destructive text-sm">{createError}</p> : null}
              <Button type="submit" disabled={createGroup.isPending || !groupName}>
                {createGroup.isPending ? t.groups.creating : t.groups.create}
              </Button>
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
