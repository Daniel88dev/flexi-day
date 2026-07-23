"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AvatarBubble } from "@/components/brand/avatar-bubble";
import {
  useGroupUsers,
  useGroups,
  useQuotas,
  useSetUserQuota,
  useUpdateGroupQuotas,
  useUpdateGroupUsers,
} from "@/lib/api/queries";
import { useSession } from "@/lib/auth-client";
import type { Group, GroupUserListItem } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type Tab = "members" | "quotas";

export default function GroupDetailPage() {
  const search = useSearchParams();
  const groupId = search.get("groupId") ?? "";
  const initialTab: Tab = search.get("tab") === "quotas" ? "quotas" : "members";
  const [tab, setTab] = useState<Tab>(initialTab);

  const { data: session } = useSession();
  const userId = session?.user?.id;

  const groupsQuery = useGroups();
  const membersQuery = useGroupUsers(groupId);
  const group = groupsQuery.data?.find((g) => g.id === groupId);
  // The backend authorizes on the membership's adminAccess flag; the manager
  // is an admin too, even before a membership row grants it.
  const isAdmin = useMemo(() => {
    if (userId && userId === group?.managerUserId) return true;
    return membersQuery.data?.some((m) => m.userId === userId && m.adminAccess) ?? false;
  }, [userId, group, membersQuery.data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs">
            <Link href="/groups" className="hover:text-foreground hover:underline">
              ← All groups
            </Link>
          </p>
          <h1 className="font-heading text-2xl font-bold">{group?.groupName ?? "Group"}</h1>
          {group ? (
            <p className="text-muted-foreground mt-1 text-sm">
              Default vacation {group.defaultVacationDays} d · Default home office{" "}
              {group.defaultHomeOfficeDays} d
            </p>
          ) : null}
        </div>
      </div>

      <div className="border-border flex gap-1 border-b">
        {(["members", "quotas"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium capitalize transition-colors",
              tab === t
                ? "border-primary text-primary"
                : "text-muted-foreground hover:text-foreground border-transparent"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "members" ? (
        <MembersTab groupId={groupId} isAdmin={isAdmin} />
      ) : (
        <QuotasTab groupId={groupId} group={group} isAdmin={isAdmin} />
      )}
    </div>
  );
}

function MembersTab({ groupId, isAdmin }: { groupId: string; isAdmin: boolean }) {
  const membersQuery = useGroupUsers(groupId);
  const updateMembers = useUpdateGroupUsers();

  const [draft, setDraft] = useState<Record<string, GroupUserListItem> | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const members = membersQuery.data ?? [];
  const editing = draft !== null;

  function startEdit() {
    const next: Record<string, GroupUserListItem> = {};
    for (const m of members) next[m.id] = { ...m };
    setDraft(next);
  }

  function cancelEdit() {
    setDraft(null);
    setSaveError(null);
  }

  function toggle(id: string, field: "viewAccess" | "adminAccess" | "controlledUser") {
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
          controlledUser: m.controlledUser,
        })),
      });
      setDraft(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    }
  }

  const rows = editing ? Object.values(draft!) : members;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {membersQuery.isLoading
            ? "Loading…"
            : `${members.length} member${members.length === 1 ? "" : "s"}`}
        </p>
        {isAdmin ? (
          editing ? (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button size="sm" onClick={save} disabled={updateMembers.isPending}>
                {updateMembers.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={startEdit}>
              Edit permissions
            </Button>
          )
        ) : null}
      </div>

      {saveError ? <p className="text-destructive text-sm">{saveError}</p> : null}

      {membersQuery.error ? (
        <p className="text-destructive text-sm">{membersQuery.error.message}</p>
      ) : members.length === 0 && !membersQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">No members yet.</p>
      ) : (
        <div className="border-border overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>View</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Tracked</TableHead>
                <TableHead>Joined</TableHead>
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
                      value={m.controlledUser}
                      editing={editing}
                      onToggle={() => toggle(m.id, "controlledUser")}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(m.createdAt).toLocaleDateString("en-GB")}
                  </TableCell>
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
  const className = cn(
    "rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
    value
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      : "bg-muted text-muted-foreground"
  );
  if (!editing) return <span className={className}>{value ? "Yes" : "No"}</span>;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(className, "hover:ring-foreground/30 hover:ring-1")}
    >
      {value ? "Yes" : "No"}
    </button>
  );
}

/**
 * Members and their allowance for a year. Quota rows only exist once someone
 * has been given an allowance, so the table is driven by the member list and
 * shows the group defaults for anyone without a row yet — that way an admin
 * can grant the first allowance from the same place.
 */
function QuotasTab({ groupId, group, isAdmin }: { groupId: string; group?: Group; isAdmin: boolean }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const quotasQuery = useQuotas(groupId, { year });
  const membersQuery = useGroupUsers(groupId);
  const setQuota = useSetUserQuota();

  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ vacationDays: number | ""; homeOfficeDays: number | "" }>({
    vacationDays: "",
    homeOfficeDays: "",
  });
  const [saveError, setSaveError] = useState<string | null>(null);

  const quotaByUser = useMemo(
    () => new Map((quotasQuery.data ?? []).map((q) => [q.userId, q])),
    [quotasQuery.data]
  );
  const members = membersQuery.data ?? [];

  function startEdit(userId: string) {
    const quota = quotaByUser.get(userId);
    setSaveError(null);
    setEditing(userId);
    setDraft({
      vacationDays: quota?.vacationDays ?? group?.defaultVacationDays ?? 0,
      homeOfficeDays: quota?.homeOfficeDays ?? group?.defaultHomeOfficeDays ?? 0,
    });
  }

  async function save(userId: string) {
    setSaveError(null);
    try {
      await setQuota.mutateAsync({
        groupId,
        userId,
        year,
        vacationDays: typeof draft.vacationDays === "number" ? draft.vacationDays : 0,
        homeOfficeDays: typeof draft.homeOfficeDays === "number" ? draft.homeOfficeDays : 0,
      });
      setEditing(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save quota");
    }
  }

  return (
    <div className="space-y-4">
      {isAdmin ? <GroupDefaultsCard group={group} /> : null}

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon-sm" onClick={() => setYear((y) => y - 1)}>
          ‹
        </Button>
        <span className="font-heading w-[80px] text-center text-sm font-medium">{year}</span>
        <Button variant="outline" size="icon-sm" onClick={() => setYear((y) => y + 1)}>
          ›
        </Button>
      </div>

      {saveError ? <p className="text-destructive text-sm">{saveError}</p> : null}

      {quotasQuery.error ? (
        <p className="text-destructive text-sm">{quotasQuery.error.message}</p>
      ) : quotasQuery.isLoading || membersQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : members.length === 0 ? (
        <p className="text-muted-foreground text-sm">No members yet.</p>
      ) : (
        <div className="border-border overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Vacation days</TableHead>
                <TableHead>Home office days</TableHead>
                {isAdmin ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => {
                const quota = quotaByUser.get(m.userId);
                const isEditingRow = editing === m.userId;
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <AvatarBubble
                          initials={m.user.initials}
                          background={m.user.avatarColor}
                          name={m.user.name}
                          size={26}
                        />
                        <span className="text-sm font-medium">{m.user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isEditingRow ? (
                        <QuotaInput
                          label={`Vacation days for ${m.user.name}`}
                          value={draft.vacationDays}
                          onChange={(vacationDays) => setDraft((d) => ({ ...d, vacationDays }))}
                        />
                      ) : (
                        <QuotaValue value={quota?.vacationDays} fallback={group?.defaultVacationDays} />
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditingRow ? (
                        <QuotaInput
                          label={`Home office days for ${m.user.name}`}
                          value={draft.homeOfficeDays}
                          onChange={(homeOfficeDays) => setDraft((d) => ({ ...d, homeOfficeDays }))}
                        />
                      ) : (
                        <QuotaValue
                          value={quota?.homeOfficeDays}
                          fallback={group?.defaultHomeOfficeDays}
                        />
                      )}
                    </TableCell>
                    {isAdmin ? (
                      <TableCell className="text-right">
                        {isEditingRow ? (
                          <div className="flex justify-end gap-2">
                            <Button size="xs" variant="ghost" onClick={() => setEditing(null)}>
                              Cancel
                            </Button>
                            <Button
                              size="xs"
                              disabled={setQuota.isPending}
                              onClick={() => save(m.userId)}
                            >
                              {setQuota.isPending ? "Saving…" : "Save"}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => startEdit(m.userId)}
                            disabled={editing !== null}
                          >
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function QuotaValue({ value, fallback }: { value?: number; fallback?: number }) {
  if (value !== undefined) return <span className="text-sm">{value}</span>;
  return (
    <span className="text-muted-foreground text-sm">
      {fallback ?? 0} <span className="text-xs">(default)</span>
    </span>
  );
}

function QuotaInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | "";
  onChange: (value: number | "") => void;
}) {
  return (
    <Input
      type="number"
      min={0}
      max={365}
      aria-label={label}
      className="h-8 w-24"
      value={value}
      onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
    />
  );
}

/** Group-wide defaults: what a member gets before anyone sets their allowance. */
function GroupDefaultsCard({ group }: { group?: Group }) {
  const updateQuotas = useUpdateGroupQuotas();
  const [vacation, setVacation] = useState<number | "">(group?.defaultVacationDays ?? 20);
  const [homeOffice, setHomeOffice] = useState<number | "">(group?.defaultHomeOfficeDays ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!group) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!group) return;
    setError(null);
    setSaved(false);
    try {
      await updateQuotas.mutateAsync({
        groupId: group.id,
        defaultVacationDays: typeof vacation === "number" ? vacation : 0,
        defaultHomeOfficeDays: typeof homeOffice === "number" ? homeOffice : 0,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save defaults");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group defaults</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="defaultVacation">Vacation days</Label>
            <Input
              id="defaultVacation"
              type="number"
              min={0}
              max={365}
              className="w-28"
              value={vacation}
              onChange={(e) => setVacation(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="defaultHomeOffice">Home office days</Label>
            <Input
              id="defaultHomeOffice"
              type="number"
              min={0}
              max={365}
              className="w-28"
              value={homeOffice}
              onChange={(e) => setHomeOffice(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
          <Button type="submit" disabled={updateQuotas.isPending}>
            {updateQuotas.isPending ? "Saving…" : "Save defaults"}
          </Button>
          {error ? <p className="text-destructive w-full text-sm">{error}</p> : null}
          {saved && !error ? (
            <p className="w-full text-sm text-green-700 dark:text-green-400">Defaults updated.</p>
          ) : null}
        </form>
        <p className="text-muted-foreground mt-3 text-xs">
          Applies to members who have no allowance set for a year. Existing allowances are not
          changed.
        </p>
      </CardContent>
    </Card>
  );
}
