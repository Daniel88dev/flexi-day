"use client";

import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AccountDeletedLabel } from "@/components/account-deleted-label";
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
import { ApiError } from "@/lib/api/client";
import type { GroupUserListItem } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";

const PERMISSION_FIELDS = [
  "viewAccess",
  "adminAccess",
  "approverAccess",
  "controlledUser",
] as const;
type PermissionField = (typeof PERMISSION_FIELDS)[number];
// `base` is the server value when the admin first toggled the field; clicking back to it undoes the edit.
type PendingField = { value: boolean; base: boolean };
type PendingFields = Partial<Record<PermissionField, PendingField>>;
type PendingMember = { name: string; fields: PendingFields };
type PendingEdits = Record<string, PendingMember>;

const resolve = (
  member: GroupUserListItem,
  fields: PendingFields | undefined,
  field: PermissionField
): boolean => fields?.[field]?.value ?? member[field];

function hasNetChange(edit: PendingMember, server: GroupUserListItem | undefined): boolean {
  return PERMISSION_FIELDS.some((f) => {
    const entry = edit.fields[f];
    return entry !== undefined && entry.value !== (server ? server[f] : entry.base);
  });
}

function withoutUsers(edits: PendingEdits | null, userIds: string[]): PendingEdits | null {
  if (edits === null) return null;
  const kept = { ...edits };
  for (const userId of userIds) delete kept[userId];
  return kept;
}

export function MembersTab({ groupId, isAdmin }: { groupId: string; isAdmin: boolean }) {
  const { t } = useTranslation();
  const membersQuery = useGroupUsers(groupId);
  const updateMembers = useUpdateGroupUsers();
  const removeMember = useRemoveGroupUser();
  const billingQuery = useSubscription();
  const groupQuery = useGroup(groupId);
  const group = groupQuery.data;
  const managerUserId = group?.managerUserId;
  const billedHere =
    billingQuery.data?.organization != null &&
    group?.organizationId === billingQuery.data.organization.id;

  // A user's display name rides along so a departure can still be named.
  const [pending, setPending] = useState<PendingEdits | null>(null);
  const submittingRef = useRef(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Per-row so one removal does not disable every other row's button.
  const [removingId, setRemovingId] = useState<string | null>(null);

  const members = membersQuery.data ?? [];
  const editing = pending !== null;
  const maxMembers = billedHere ? billingQuery.data?.entitlements.maxMembersPerGroup : undefined;

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
    setPending({});
  }

  function cancelEdit() {
    setPending(null);
    setSaveError(null);
  }

  function toggle(member: GroupUserListItem, field: PermissionField) {
    if (!pending || saving) return;
    const edit = pending[member.userId];
    const base = edit?.fields[field]?.base ?? member[field];
    const value = !resolve(member, edit?.fields, field);
    const fields: PendingFields = { ...edit?.fields };
    if (value === base) delete fields[field];
    else fields[field] = { value, base };
    const rest = withoutUsers(pending, [member.userId])!;
    setPending(
      Object.keys(fields).length > 0
        ? { ...rest, [member.userId]: { name: member.user.name, fields } }
        : rest
    );
  }

  function rejectIfDeparted(
    edits: PendingEdits,
    current: GroupUserListItem[],
    lastSeen: GroupUserListItem[]
  ): boolean {
    const present = new Set(current.map((m) => m.userId));
    const departed = Object.keys(edits).filter(
      (userId) =>
        !present.has(userId) &&
        hasNetChange(
          edits[userId],
          lastSeen.find((m) => m.userId === userId)
        )
    );
    if (departed.length === 0) return false;
    setPending((prev) => withoutUsers(prev, departed));
    setSaveError(t.groupDetail.membersLeftNotSaved(departed.map((id) => edits[id].name)));
    return true;
  }

  async function save() {
    if (!pending || submittingRef.current) return;
    submittingRef.current = true;
    setSaveError(null);
    setSaving(true);
    try {
      await submit(pending, members);
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  }

  async function submit(edits: PendingEdits, lastSeen: GroupUserListItem[]) {
    const refreshed = await membersQuery.refetch();
    if (refreshed.error || !refreshed.data) {
      setSaveError(t.groupDetail.saveFailed);
      return;
    }
    const fresh = refreshed.data;
    if (rejectIfDeparted(edits, fresh, lastSeen)) return;

    const data = fresh.flatMap((m) => {
      const edit = edits[m.userId];
      if (!edit || !hasNetChange(edit, m)) return [];
      const flags = {} as Record<PermissionField, boolean>;
      for (const f of PERMISSION_FIELDS) flags[f] = resolve(m, edit.fields, f);
      return [{ userId: m.userId, ...flags }];
    });
    if (data.length === 0) {
      setPending(null);
      return;
    }

    try {
      await updateMembers.mutateAsync({ groupId, data });
      setPending(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const after = await membersQuery.refetch();
        if (after.error || !after.data) {
          setSaveError(t.groupDetail.saveFailed);
          return;
        }
        if (rejectIfDeparted(edits, after.data, fresh)) return;
      }
      setSaveError(err instanceof Error ? err.message : t.groupDetail.saveFailed);
    }
  }

  const displayedValue = (m: GroupUserListItem, field: PermissionField) =>
    resolve(m, pending?.[m.userId]?.fields, field);

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
              <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={saving}>
                {t.common.cancel}
              </Button>
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? t.common.saving : t.common.save}
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
        <>
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
                {members.map((m) => (
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
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-medium">{m.user.name}</span>
                            {managerUserId !== undefined && m.userId === managerUserId ? (
                              <Badge
                                className="bg-primary/10 text-primary uppercase"
                                variant="outline"
                              >
                                {t.groups.manager}
                              </Badge>
                            ) : null}
                            {m.accountDeleted ? <AccountDeletedLabel /> : null}
                          </div>
                          {m.accountDeleted ? null : (
                            <div className="text-muted-foreground truncate text-xs">{m.email}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <PermBadge
                        value={displayedValue(m, "viewAccess")}
                        editing={editing}
                        disabled={saving}
                        onToggle={() => toggle(m, "viewAccess")}
                      />
                    </TableCell>
                    <TableCell>
                      <PermBadge
                        value={displayedValue(m, "adminAccess")}
                        editing={editing}
                        disabled={saving}
                        onToggle={() => toggle(m, "adminAccess")}
                      />
                    </TableCell>
                    <TableCell>
                      <PermBadge
                        value={displayedValue(m, "approverAccess")}
                        editing={editing}
                        disabled={saving}
                        onToggle={() => toggle(m, "approverAccess")}
                      />
                    </TableCell>
                    <TableCell>
                      <PermBadge
                        value={displayedValue(m, "controlledUser")}
                        editing={editing}
                        disabled={saving}
                        onToggle={() => toggle(m, "controlledUser")}
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
          <section
            aria-label={t.groupDetail.legend.label}
            className="bg-muted/40 text-muted-foreground rounded-lg px-3 py-2.5 text-xs"
          >
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              {(
                [
                  [t.groupDetail.columns.view, t.groupDetail.legend.view],
                  [t.groupDetail.columns.admin, t.groupDetail.legend.admin],
                  [t.groupDetail.columns.approver, t.groupDetail.legend.approver],
                  [t.groupDetail.columns.tracked, t.groupDetail.legend.tracked],
                ] as const
              ).map(([term, definition]) => (
                <div key={term} className="contents">
                  <dt className="text-foreground font-medium">{term}</dt>
                  <dd>{definition}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2">{t.groupDetail.legend.manager}</p>
          </section>
        </>
      )}
    </div>
  );
}

function PermBadge({
  value,
  editing,
  disabled,
  onToggle,
}: {
  value: boolean;
  editing: boolean;
  disabled: boolean;
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
      disabled={disabled}
      className={cn(className, "hover:ring-foreground/30 hover:ring-1 disabled:opacity-60")}
    >
      {text}
    </button>
  );
}
