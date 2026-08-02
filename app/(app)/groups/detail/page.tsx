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
import { pushToast } from "@/components/toast";
import {
  useCreateGroupInvite,
  useGroupInvites,
  useGroupMirrors,
  useGroupUsers,
  useGroups,
  useQuotas,
  useRevokeGroupInvite,
  useSetGroupMirrors,
  useSetUserQuota,
  useUpdateGroupQuotas,
  useUpdateGroupUsers,
  useUpdateGroupWorkingDays,
} from "@/lib/api/queries";
import { useSession } from "@/lib/auth-client";
import type { Group, GroupUserListItem } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";

type Tab = "members" | "quotas" | "invites" | "mirroring";

const TAB_ORDER: Tab[] = ["members", "quotas", "invites", "mirroring"];

const isTab = (value: string | null): value is Tab =>
  value !== null && (TAB_ORDER as string[]).includes(value);

export default function GroupDetailPage() {
  const { t } = useTranslation();
  const search = useSearchParams();
  const groupId = search.get("groupId") ?? "";
  const tabParam = search.get("tab");
  const [tab, setTab] = useState<Tab>(isTab(tabParam) ? tabParam : "members");

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
              {t.groupDetail.allGroups}
            </Link>
          </p>
          <h1 className="font-heading text-2xl font-bold">
            {group?.groupName ?? t.groupDetail.fallbackName}
          </h1>
          {group ? (
            <p className="text-muted-foreground mt-1 text-sm">
              {t.groupDetail.defaultsSummary(
                group.defaultVacationDays,
                group.defaultHomeOfficeDays
              )}
            </p>
          ) : null}
        </div>
      </div>

      <div className="border-border flex gap-1 border-b">
        {TAB_ORDER.filter((tb) => tb !== "invites" || isAdmin).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tab === tb
                ? "border-primary text-primary"
                : "text-muted-foreground hover:text-foreground border-transparent"
            )}
          >
            {t.groupDetail.tabs[tb]}
          </button>
        ))}
      </div>

      {tab === "members" ? (
        <MembersTab groupId={groupId} isAdmin={isAdmin} />
      ) : tab === "quotas" ? (
        <QuotasTab groupId={groupId} group={group} isAdmin={isAdmin} />
      ) : tab === "invites" ? (
        <InvitesTab groupId={groupId} isAdmin={isAdmin} />
      ) : (
        <MirroringTab groupId={groupId} groupName={group?.groupName} />
      )}
    </div>
  );
}

/**
 * Invite people by email. The code is shown alongside so an admin can pass it
 * on directly — useful when the mail bounces, and the only way to recover an
 * invite whose email never arrived.
 */
function InvitesTab({ groupId, isAdmin }: { groupId: string; isAdmin: boolean }) {
  const { t } = useTranslation();
  const invitesQuery = useGroupInvites(groupId, isAdmin);
  const createInvite = useCreateGroupInvite();
  const revokeInvite = useRevokeGroupInvite(groupId);

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ email: string; delivered: boolean } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isAdmin) {
    return <p className="text-muted-foreground text-sm">{t.groupDetail.invites.adminOnly}</p>;
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      const result = await createInvite.mutateAsync({ groupId, email: email.trim() });
      setNotice({ email: email.trim(), delivered: result.emailDelivered });
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.groupDetail.invites.failed);
    }
  }

  async function copyCode(id: string, code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000);
    } catch {
      // Clipboard access can be denied; the code is visible on screen anyway.
    }
  }

  const invites = invitesQuery.data ?? [];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>{t.groupDetail.invites.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[260px] flex-1 space-y-1.5">
              <Label htmlFor="inviteEmail">{t.groupDetail.invites.emailLabel}</Label>
              <Input
                id="inviteEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.groupDetail.invites.emailPlaceholder}
              />
            </div>
            <Button type="submit" disabled={createInvite.isPending || !email.trim()}>
              {createInvite.isPending ? t.groupDetail.invites.sending : t.groupDetail.invites.send}
            </Button>
          </form>
          {error ? <p className="text-destructive mt-3 text-sm">{error}</p> : null}
          {notice ? (
            <p
              className={cn(
                "mt-3 text-sm",
                notice.delivered ? "text-green-700 dark:text-green-400" : "text-amber-700"
              )}
            >
              {notice.delivered
                ? t.groupDetail.invites.sent(notice.email)
                : t.groupDetail.invites.sentNoEmail(notice.email)}
            </p>
          ) : null}
          <p className="text-muted-foreground mt-3 text-xs">{t.groupDetail.invites.note}</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">{t.groupDetail.invites.pendingTitle}</h2>
        {invitesQuery.error ? (
          <p className="text-destructive text-sm">{invitesQuery.error.message}</p>
        ) : invitesQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">{t.common.loading}</p>
        ) : invites.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t.groupDetail.invites.none}</p>
        ) : (
          <div className="border-border overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.groupDetail.invites.columns.email}</TableHead>
                  <TableHead>{t.groupDetail.invites.columns.code}</TableHead>
                  <TableHead>{t.groupDetail.invites.columns.expires}</TableHead>
                  <TableHead className="text-right">{t.groupDetail.columns.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="text-sm">{invite.email}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => void copyCode(invite.id, invite.code)}
                        title={t.groupDetail.invites.copy}
                        className="bg-muted hover:ring-foreground/30 rounded px-2 py-1 font-mono text-xs tracking-wider hover:ring-1"
                      >
                        {copiedId === invite.id ? t.groupDetail.invites.copied : invite.code}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(invite.expiresAt).toLocaleDateString(t.common.dateLocale)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={revokeInvite.isPending}
                        onClick={() => revokeInvite.mutate(invite.id)}
                      >
                        {t.groupDetail.invites.revoke}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Per-user setting: which of the caller's other groups show their records here.
 * Mirrored records are display-only — they stay owned by, approved in, and
 * counted against their source group.
 */
function MirroringTab({ groupId, groupName }: { groupId: string; groupName?: string }) {
  const { t } = useTranslation();
  const mirrorsQuery = useGroupMirrors(groupId);
  const setMirrors = useSetGroupMirrors();

  const [draft, setDraft] = useState<Set<string> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const candidates = useMemo(() => mirrorsQuery.data?.candidates ?? [], [mirrorsQuery.data]);
  const selected = useMemo(
    () => draft ?? new Set(candidates.filter((c) => c.mirrored).map((c) => c.groupId)),
    [draft, candidates]
  );

  function toggle(sourceGroupId: string) {
    setSaved(false);
    setError(null);
    const next = new Set(selected);
    if (next.has(sourceGroupId)) next.delete(sourceGroupId);
    else next.add(sourceGroupId);
    setDraft(next);
  }

  async function save() {
    setError(null);
    setSaved(false);
    try {
      await setMirrors.mutateAsync({ groupId, sourceGroupIds: Array.from(selected) });
      setDraft(null);
      setSaved(true);
      pushToast(t.common.saved);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.groupDetail.mirroring.failed;
      setError(message);
      pushToast(message, "danger");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t.groupDetail.mirroring.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            {t.groupDetail.mirroring.description(groupName ?? t.groupDetail.fallbackName)}
          </p>

          {mirrorsQuery.error ? (
            <p className="text-destructive text-sm">{mirrorsQuery.error.message}</p>
          ) : mirrorsQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">{t.common.loading}</p>
          ) : candidates.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t.groupDetail.mirroring.noOtherGroups}</p>
          ) : (
            <>
              <div className="space-y-2">
                {candidates.map((candidate) => {
                  const active = selected.has(candidate.groupId);
                  return (
                    <label
                      key={candidate.groupId}
                      className="border-border hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5"
                    >
                      <input
                        type="checkbox"
                        className="accent-primary h-4 w-4"
                        checked={active}
                        onChange={() => toggle(candidate.groupId)}
                      />
                      <span className="text-sm font-medium">{candidate.groupName}</span>
                    </label>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={save} disabled={setMirrors.isPending || draft === null}>
                  {setMirrors.isPending ? t.common.saving : t.groupDetail.mirroring.save}
                </Button>
                {error ? <p className="text-destructive text-sm">{error}</p> : null}
                {saved && !error ? (
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {t.groupDetail.mirroring.updated}
                  </p>
                ) : null}
              </div>
            </>
          )}

          <p className="text-muted-foreground text-xs">{t.groupDetail.mirroring.note}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function MembersTab({ groupId, isAdmin }: { groupId: string; isAdmin: boolean }) {
  const { t } = useTranslation();
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
      setSaveError(err instanceof Error ? err.message : t.groupDetail.saveFailed);
    }
  }

  const rows = editing ? Object.values(draft!) : members;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {membersQuery.isLoading ? t.common.loading : t.groupDetail.membersCount(members.length)}
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
                <TableHead>{t.groupDetail.columns.tracked}</TableHead>
                <TableHead>{t.groupDetail.columns.joined}</TableHead>
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
                    {new Date(m.createdAt).toLocaleDateString(t.common.dateLocale)}
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

/**
 * Members and their allowance for a year. Quota rows only exist once someone
 * has been given an allowance, so the table is driven by the member list and
 * shows the group defaults for anyone without a row yet — that way an admin
 * can grant the first allowance from the same place.
 */
function QuotasTab({
  groupId,
  group,
  isAdmin,
}: {
  groupId: string;
  group?: Group;
  isAdmin: boolean;
}) {
  const { t } = useTranslation();
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
      setSaveError(err instanceof Error ? err.message : t.groupDetail.saveQuotaFailed);
    }
  }

  return (
    <div className="space-y-4">
      {isAdmin ? <GroupDefaultsCard group={group} /> : null}
      {isAdmin ? <GroupWorkingDaysCard group={group} /> : null}

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
        <p className="text-muted-foreground text-sm">{t.common.loading}</p>
      ) : members.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t.groupDetail.noMembers}</p>
      ) : (
        <div className="border-border overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.groupDetail.columns.member}</TableHead>
                <TableHead>{t.groupDetail.columns.vacationDays}</TableHead>
                <TableHead>{t.groupDetail.columns.homeOfficeDays}</TableHead>
                {isAdmin ? (
                  <TableHead className="text-right">{t.groupDetail.columns.actions}</TableHead>
                ) : null}
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
                          label={t.groupDetail.vacationDaysFor(m.user.name)}
                          value={draft.vacationDays}
                          onChange={(vacationDays) => setDraft((d) => ({ ...d, vacationDays }))}
                        />
                      ) : (
                        <QuotaValue
                          value={quota?.vacationDays}
                          fallback={group?.defaultVacationDays}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditingRow ? (
                        <QuotaInput
                          label={t.groupDetail.homeOfficeDaysFor(m.user.name)}
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
                              {t.common.cancel}
                            </Button>
                            <Button
                              size="xs"
                              disabled={setQuota.isPending}
                              onClick={() => save(m.userId)}
                            >
                              {setQuota.isPending ? t.common.saving : t.common.save}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => startEdit(m.userId)}
                            disabled={editing !== null}
                          >
                            {t.common.edit}
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
  const { t } = useTranslation();
  if (value !== undefined) return <span className="text-sm">{value}</span>;
  return (
    <span className="text-muted-foreground text-sm">
      {fallback ?? 0} <span className="text-xs">{t.groupDetail.default}</span>
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
  const { t } = useTranslation();
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
      setError(err instanceof Error ? err.message : t.groupDetail.saveDefaultsFailed);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.groupDetail.groupDefaults}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="defaultVacation">{t.groupDetail.vacationDays}</Label>
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
            <Label htmlFor="defaultHomeOffice">{t.groupDetail.homeOfficeDays}</Label>
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
            {updateQuotas.isPending ? t.common.saving : t.groupDetail.saveDefaults}
          </Button>
          {error ? <p className="text-destructive w-full text-sm">{error}</p> : null}
          {saved && !error ? (
            <p className="w-full text-sm text-green-700 dark:text-green-400">
              {t.groupDetail.defaultsUpdated}
            </p>
          ) : null}
        </form>
        <p className="text-muted-foreground mt-3 text-xs">{t.groupDetail.defaultsNote}</p>
      </CardContent>
    </Card>
  );
}

// Display order is Monday-first (matching `weekdaysShort`); the stored values
// are `Date.getDay()` numbers (0=Sun … 6=Sat), so index i maps to (i + 1) % 7.
const displayIndexToWeekday = (i: number) => (i + 1) % 7;

function GroupWorkingDaysCard({ group }: { group?: Group }) {
  const { t } = useTranslation();
  const updateWorkingDays = useUpdateGroupWorkingDays();
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(group?.workingDays ?? [1, 2, 3, 4, 5])
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!group) return null;

  function toggle(weekday: number) {
    setSaved(false);
    setError(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(weekday)) next.delete(weekday);
      else next.add(weekday);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!group) return;
    setError(null);
    setSaved(false);
    if (selected.size === 0) {
      setError(t.groupDetail.workingDaysError);
      return;
    }
    try {
      await updateWorkingDays.mutateAsync({
        groupId: group.id,
        workingDays: Array.from(selected).sort((a, b) => a - b),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.groupDetail.saveWorkingDaysFailed);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.groupDetail.workingDays}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {t.calendar.weekdaysShort.map((label, i) => {
              const weekday = displayIndexToWeekday(i);
              const active = selected.has(weekday);
              return (
                <button
                  key={weekday}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(weekday)}
                  className={cn(
                    "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:ring-foreground/30 hover:ring-1"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={updateWorkingDays.isPending}>
              {updateWorkingDays.isPending ? t.common.saving : t.groupDetail.saveWorkingDays}
            </Button>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            {saved && !error ? (
              <p className="text-sm text-green-700 dark:text-green-400">
                {t.groupDetail.workingDaysUpdated}
              </p>
            ) : null}
          </div>
        </form>
        <p className="text-muted-foreground mt-3 text-xs">{t.groupDetail.workingDaysNote}</p>
      </CardContent>
    </Card>
  );
}
