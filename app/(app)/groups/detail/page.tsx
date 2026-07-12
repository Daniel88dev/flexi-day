"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGroupUsers, useGroups, useQuotas, useUpdateGroupUsers } from "@/lib/api/queries";
import { useSession } from "@/lib/auth-client";
import type { GroupUser } from "@/lib/api/types";
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
  const group = groupsQuery.data?.find((g) => g.id === groupId);
  const isAdmin = useMemo(() => {
    return userId === group?.managerUserId;
  }, [userId, group]);

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
        <QuotasTab groupId={groupId} />
      )}
    </div>
  );
}

function MembersTab({ groupId, isAdmin }: { groupId: string; isAdmin: boolean }) {
  const membersQuery = useGroupUsers(groupId);
  const updateMembers = useUpdateGroupUsers();

  const [draft, setDraft] = useState<Record<string, GroupUser> | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const members = membersQuery.data ?? [];
  const editing = draft !== null;

  function startEdit() {
    const next: Record<string, GroupUser> = {};
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
                <TableHead>User ID</TableHead>
                <TableHead>View</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Tracked</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.userId.slice(0, 8)}…</TableCell>
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

function QuotasTab({ groupId }: { groupId: string }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const quotasQuery = useQuotas(groupId, { year });
  const quotas = quotasQuery.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon-sm" onClick={() => setYear((y) => y - 1)}>
          ‹
        </Button>
        <span className="font-heading w-[80px] text-center text-sm font-medium">{year}</span>
        <Button variant="outline" size="icon-sm" onClick={() => setYear((y) => y + 1)}>
          ›
        </Button>
      </div>

      {quotasQuery.error ? (
        <p className="text-destructive text-sm">{quotasQuery.error.message}</p>
      ) : quotasQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : quotas.length === 0 ? (
        <p className="text-muted-foreground text-sm">No quotas set for {year} yet.</p>
      ) : (
        <div className="border-border overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Vacation days</TableHead>
                <TableHead>Home office days</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotas.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-mono text-xs">{q.userId.slice(0, 8)}…</TableCell>
                  <TableCell>{q.vacationDays}</TableCell>
                  <TableCell>{q.homeOfficeDays}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
