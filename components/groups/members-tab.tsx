"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AvatarBubble } from "@/components/brand/avatar-bubble";
import { pushToast } from "@/components/toast";
import {
  useGroupUsers,
  useGroup,
  useRemoveGroupUser,
  useSubscription,
  useUpdateGroupUsers,
} from "@/lib/api/queries";
import type { GroupUserListItem } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";

export function MembersTab({ groupId, isAdmin }: { groupId: string; isAdmin: boolean }) {
  const { t } = useTranslation();
  const membersQuery = useGroupUsers(groupId);
  const updateMembers = useUpdateGroupUsers();
  const removeMember = useRemoveGroupUser();
  const billingQuery = useSubscription();
  const groupQuery = useGroup(groupId);
  const group = groupQuery.data;
  const managerUserId = group?.managerUserId;
  const ownsThisGroup =
    billingQuery.data?.organization != null &&
    group?.organizationId === billingQuery.data.organization.id;

  const [draft, setDraft] = useState<Record<string, GroupUserListItem> | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Per-row so one removal does not disable every other row's button.
  const [removingId, setRemovingId] = useState<string | null>(null);

  const members = membersQuery.data ?? [];
  const editing = draft !== null;
  const maxMembers = ownsThisGroup ? billingQuery.data?.entitlements.maxMembersPerGroup : undefined;

  async function handleRemove(member: GroupUserListItem) {
    if (!window.confirm(t.groupDetail.removeConfirm(member.user.name))) return;
    setRemovingId(member.userId);
    try {
      await removeMember.mutateAsync({ groupId, userId: member.userId });
      pushToast(t.groupDetail.memberRemoved);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : t.groupDetail.removeFailed, "danger");
    } finally {
      setRemovingId(null);
    }
  }

  function startEdit() {
    const next: Record<string, GroupUserListItem> = {};
    for (const m of members) next[m.id] = { ...m };
    setDraft(next);
  }

  function cancelEdit() {
    setDraft(null);
    setSaveError(null);
  }

  function toggle(
    id: string,
    field: "viewAccess" | "adminAccess" | "approverAccess" | "controlledUser"
  ) {
    if (!draft) return;
    setDraft({ ...draft, [id]: { ...draft[id], [field]: !draft[id][field] } });
  }

  async function save() {
    if (!draft) return;
    setSaveError(null);
    try {
      await updateMembers.mutateAsync({
        groupId,
        data: Object.values(draft).map((m) => ({
          userId: m.userId,
          viewAccess: m.viewAccess,
          adminAccess: m.adminAccess,
          approverAccess: m.approverAccess,
          controlledUser: m.controlledUser,
        })),
      });
      setDraft(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t.groupDetail.saveFailed);
    }
  }

  const rows = editing ? Object.values(draft!) : members;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {membersQuery.isLoading
            ? t.common.loading
            : maxMembers !== undefined
              ? t.billing.membersCount(members.length, maxMembers)
              : t.groupDetail.membersCount(members.length)}
        </p>
        {isAdmin ? (
          editing ? (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                {t.common.cancel}
              </Button>
              <Button size="sm" onClick={save} disabled={updateMembers.isPending}>
                {updateMembers.isPending ? t.common.saving : t.common.save}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={startEdit}>
              {t.groupDetail.editPermissions}
            </Button>
          )
        ) : null}
      </div>

      {saveError ? <p className="text-destructive text-sm">{saveError}</p> : null}

      {membersQuery.error ? (
        <p className="text-destructive text-sm">{membersQuery.error.message}</p>
      ) : members.length === 0 && !membersQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">{t.groupDetail.noMembers}</p>
      ) : (
        <div className="border-border overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.groupDetail.columns.member}</TableHead>
                <TableHead>{t.groupDetail.columns.view}</TableHead>
                <TableHead>{t.groupDetail.columns.admin}</TableHead>
                <TableHead>{t.groupDetail.columns.approver}</TableHead>
                <TableHead>{t.groupDetail.columns.tracked}</TableHead>
                <TableHead>{t.groupDetail.columns.joined}</TableHead>
                {isAdmin && !editing ? <TableHead className="text-right" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <AvatarBubble
                        initials={m.user.initials}
                        background={m.user.avatarColor}
                        name={m.user.name}
                        size={26}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{m.user.name}</div>
                        <div className="text-muted-foreground truncate text-xs">{m.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <PermBadge
                      value={m.viewAccess}
                      editing={editing}
                      onToggle={() => toggle(m.id, "viewAccess")}
                    />
                  </TableCell>
                  <TableCell>
                    <PermBadge
                      value={m.adminAccess}
                      editing={editing}
                      onToggle={() => toggle(m.id, "adminAccess")}
                    />
                  </TableCell>
                  <TableCell>
                    <PermBadge
                      value={m.approverAccess}
                      editing={editing}
                      onToggle={() => toggle(m.id, "approverAccess")}
                    />
                  </TableCell>
                  <TableCell>
                    <PermBadge
                      value={m.controlledUser}
                      editing={editing}
                      onToggle={() => toggle(m.id, "controlledUser")}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(m.createdAt).toLocaleDateString(t.common.dateLocale)}
                  </TableCell>
                  {isAdmin && !editing ? (
                    <TableCell className="text-right">
                      {/* `managerUserId` is undefined while the group query is
                          in flight; rendering then would offer Remove on the
                          manager, which the backend 409s. */}
                      {managerUserId !== undefined && m.userId !== managerUserId ? (
                        <Button
                          size="xs"
                          variant="outline"
                          className="text-destructive"
                          disabled={removingId !== null}
                          onClick={() => void handleRemove(m)}
                        >
                          {t.groupDetail.removeMember}
                        </Button>
                      ) : null}
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function PermBadge({
  value,
  editing,
  onToggle,
}: {
  value: boolean;
  editing: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const text = value ? t.groupDetail.yes : t.groupDetail.no;
  const className = cn(
    "rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
    value
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      : "bg-muted text-muted-foreground"
  );
  if (!editing) return <span className={className}>{text}</span>;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(className, "hover:ring-foreground/30 hover:ring-1")}
    >
      {text}
    </button>
  );
}
