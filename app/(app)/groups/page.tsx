"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GroupCard } from "@/components/groups/group-card";
import { CreateGroupForm } from "@/components/groups/create-group-form";
import { JoinGroupForm } from "@/components/groups/join-group-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroups } from "@/lib/api/queries";
import { useSession } from "@/lib/auth-client";
import { useTranslation } from "@/lib/i18n/use-translation";

export default function GroupsPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const groupsQuery = useGroups();

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
            <CreateGroupForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.groups.joinTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <JoinGroupForm />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">{t.groups.yourGroups}</h2>
        {groupsQuery.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1].map((i) => (
              <Card key={i}>
                <CardContent className="space-y-3 py-5">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 w-24 rounded-4xl" />
                    <Skeleton className="h-8 w-24 rounded-4xl" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groupsQuery.error ? (
          <p className="text-destructive text-sm">{groupsQuery.error.message}</p>
        ) : groups.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t.groups.none}</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {groups.map((g) => (
              <GroupCard key={g.id} group={g} userId={userId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
