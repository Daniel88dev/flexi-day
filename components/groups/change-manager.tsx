"use client";

import { useState } from "react";
import { UserCog } from "lucide-react";
import { AvatarBubble } from "@/components/brand/avatar-bubble";
import { pushToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { errorCode } from "@/lib/api/client";
import { useGroupUsers, useUpdateGroupManager } from "@/lib/api/queries";
import type { GroupDetail } from "@/lib/api/types";
import { useSession } from "@/lib/auth-client";
import type { Dictionary } from "@/lib/i18n";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

/** The Change manager button on the group page, for org admins only. */
export function ChangeManager({ group }: { group: GroupDetail }) {
  if (!group.access.canChangeManager) return null;
  return <ChangeManagerDialog group={group} />;
}

function ChangeManagerDialog({ group }: { group: GroupDetail }) {
  const { t } = useTranslation();
  const c = t.groupDetail.changeManager;
  const { data: session } = useSession();
  const membersQuery = useGroupUsers(group.id);
  const change = useUpdateGroupManager();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The backend refuses the caller naming themselves and anyone without a live
  // membership, so neither is offered.
  const candidates = (membersQuery.data ?? []).filter(
    (m) => !m.accountDeleted && m.userId !== group.managerUserId && m.userId !== session?.user.id
  );

  function openDialog() {
    setPicked(null);
    setError(null);
    setOpen(true);
  }

  async function confirm() {
    if (!picked) return;
    setError(null);
    try {
      await change.mutateAsync({ groupId: group.id, managerUserId: picked });
      const name = candidates.find((m) => m.userId === picked)?.user.name ?? "";
      pushToast(c.changed(name, group.groupName));
      setOpen(false);
    } catch (err) {
      setError(refusal(err, c));
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={openDialog} data-testid="change-manager">
        <UserCog className="h-4 w-4" aria-hidden />
        {c.button}
      </Button>
      <Dialog open={open} onOpenChange={(next) => !change.isPending && setOpen(next)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{c.title}</DialogTitle>
            <DialogDescription>
              {group.managerName
                ? c.current(group.managerName, group.groupName)
                : c.currentUnknown(group.groupName)}
            </DialogDescription>
          </DialogHeader>
          {candidates.length === 0 && !membersQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">{c.nobody}</p>
          ) : (
            <div
              role="radiogroup"
              aria-label={c.pick}
              className="grid max-h-72 gap-1.5 overflow-y-auto"
            >
              {candidates.map((m) => (
                <label
                  key={m.userId}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm",
                    picked === m.userId ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <input
                    type="radio"
                    name="new-manager"
                    value={m.userId}
                    aria-label={m.user.name}
                    checked={picked === m.userId}
                    onChange={() => setPicked(m.userId)}
                    className="accent-primary"
                  />
                  <AvatarBubble
                    initials={m.user.initials}
                    background={m.user.avatarColor}
                    name={m.user.name}
                    size={24}
                  />
                  <span className="min-w-0 truncate font-medium">{m.user.name}</span>
                </label>
              ))}
            </div>
          )}
          <p className="text-muted-foreground text-xs">{c.note}</p>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" disabled={change.isPending} onClick={() => setOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button disabled={!picked || change.isPending} onClick={() => void confirm()}>
              {change.isPending ? t.common.saving : c.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function refusal(err: unknown, c: Dictionary["groupDetail"]["changeManager"]): string {
  switch (errorCode(err)) {
    case "NOT_A_MEMBER":
      return c.errors.notAMember;
    case "ACCOUNT_DELETED":
      return c.errors.accountDeleted;
    case "CANNOT_NAME_SELF":
      return c.errors.self;
    default:
      return c.errors.generic;
  }
}
