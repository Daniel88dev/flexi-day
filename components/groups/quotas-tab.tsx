"use client";

import { useMemo, useState } from "react";
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
import { useGroupUsers, useQuotas, useSetUserQuota, useUpdateGroupQuotas } from "@/lib/api/queries";
import type { Group } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * Members and their allowance for a year. Quota rows only exist once someone
 * has been given an allowance, so the table is driven by the member list and
 * shows the group defaults for anyone without a row yet — that way an admin
 * can grant the first allowance from the same place.
 */
export function QuotasTab({
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
      {/* Keyed so a group switch remounts the form instead of carrying the
          previous group's defaults into a save against the new one. */}
      {isAdmin ? <GroupDefaultsCard key={group?.id} group={group} /> : null}

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
