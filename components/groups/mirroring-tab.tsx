"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AvatarBubble } from "@/components/brand/avatar-bubble";
import { pushToast } from "@/components/toast";
import { useGroupMirrors, useSetGroupMirrors } from "@/lib/api/queries";
import type { MirrorMember } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * Which members' records from other groups show up here — an admin's call, not
 * a per-user preference; a plain member only gets to see their own. Mirrored
 * records are display-only: they stay owned by, approved in, and counted
 * against their source group.
 */
export function MirroringTab({ groupId, groupName }: { groupId: string; groupName?: string }) {
  const { t } = useTranslation();
  const mirrorsQuery = useGroupMirrors(groupId);

  const name = groupName ?? t.groupDetail.fallbackName;

  if (mirrorsQuery.error) {
    return <p className="text-destructive text-sm">{mirrorsQuery.error.message}</p>;
  }
  if (mirrorsQuery.isLoading || !mirrorsQuery.data) {
    return <p className="text-muted-foreground text-sm">{t.common.loading}</p>;
  }

  const { canManage, members = [] } = mirrorsQuery.data;

  if (!canManage) {
    const mine = members[0]?.candidates ?? [];
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.groupDetail.mirroring.readOnlyTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            {t.groupDetail.mirroring.readOnlyDescription(name)}
          </p>
          {mine.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t.groupDetail.mirroring.readOnlyNone}</p>
          ) : (
            <ul className="space-y-2">
              {mine.map((candidate) => (
                <li
                  key={candidate.groupId}
                  className="border-border rounded-lg border px-3 py-2.5 text-sm font-medium"
                >
                  {candidate.groupName}
                </li>
              ))}
            </ul>
          )}
          <p className="text-muted-foreground text-xs">{t.groupDetail.mirroring.note}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t.groupDetail.mirroring.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-muted-foreground text-sm">
            {t.groupDetail.mirroring.description(name)}
          </p>

          {members.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t.groupDetail.noMembers}</p>
          ) : (
            members.map((member) => (
              <MirroringMemberRow key={member.userId} groupId={groupId} member={member} />
            ))
          )}

          <p className="text-muted-foreground text-xs">{t.groupDetail.mirroring.note}</p>
        </CardContent>
      </Card>
    </div>
  );
}

/** One member's mirror sources. Each row saves on its own. */
function MirroringMemberRow({ groupId, member }: { groupId: string; member: MirrorMember }) {
  const { t } = useTranslation();
  const setMirrors = useSetGroupMirrors();

  const [draft, setDraft] = useState<Set<string> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => draft ?? new Set(member.candidates.filter((c) => c.mirrored).map((c) => c.groupId)),
    [draft, member.candidates]
  );

  function toggle(sourceGroupId: string) {
    setError(null);
    const next = new Set(selected);
    if (next.has(sourceGroupId)) next.delete(sourceGroupId);
    else next.add(sourceGroupId);
    setDraft(next);
  }

  async function save() {
    setError(null);
    try {
      // Locked sources belong to another admin; sending them back would 403.
      const manageable = new Set(
        member.candidates.filter((c) => c.manageable).map((c) => c.groupId)
      );
      await setMirrors.mutateAsync({
        groupId,
        userId: member.userId,
        sourceGroupIds: Array.from(selected).filter((id) => manageable.has(id)),
      });
      setDraft(null);
      pushToast(t.common.saved);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.groupDetail.mirroring.failed;
      setError(message);
      pushToast(message, "danger");
    }
  }

  return (
    <div className="border-border space-y-3 rounded-lg border p-3">
      <div className="flex items-center gap-2.5">
        <AvatarBubble
          initials={member.user.initials}
          background={member.user.avatarColor}
          name={member.user.name}
          size={26}
        />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{member.user.name}</div>
          <div className="text-muted-foreground truncate text-xs">{member.email}</div>
        </div>
      </div>

      {member.candidates.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t.groupDetail.mirroring.noCandidates}</p>
      ) : (
        <>
          <div className="space-y-2">
            {member.candidates.map((candidate) => (
              <label
                key={candidate.groupId}
                className={cn(
                  "border-border flex items-center gap-3 rounded-lg border px-3 py-2",
                  candidate.manageable ? "hover:bg-muted/50 cursor-pointer" : "opacity-60"
                )}
              >
                <Checkbox
                  checked={selected.has(candidate.groupId)}
                  disabled={!candidate.manageable}
                  onCheckedChange={() => toggle(candidate.groupId)}
                />
                <span className="text-sm font-medium">{candidate.groupName}</span>
                {candidate.manageable ? null : (
                  <span className="text-muted-foreground ml-auto text-xs">
                    {t.groupDetail.mirroring.lockedHint}
                  </span>
                )}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" onClick={save} disabled={setMirrors.isPending || draft === null}>
              {setMirrors.isPending ? t.common.saving : t.groupDetail.mirroring.save}
            </Button>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
          </div>
        </>
      )}
    </div>
  );
}
