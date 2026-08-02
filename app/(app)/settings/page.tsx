"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { pushToast } from "@/components/toast";
import { useMySettings, useReportScope, useUpdateMySettings } from "@/lib/api/queries";
import type { DashboardScope } from "@/lib/api/types";
import { changePassword, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const settingsQuery = useMySettings();
  const updateSettings = useUpdateMySettings();

  const [error, setError] = useState<string | null>(null);

  // Users who never changed anything have no stored row; the backend answers
  // with the defaults, so treat a not-yet-loaded value as opted in.
  const emailNotifications = settingsQuery.data?.emailNotifications ?? true;

  async function toggleEmailNotifications(next: boolean) {
    setError(null);
    try {
      await updateSettings.mutateAsync({ emailNotifications: next });
      pushToast(t.common.saved);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.settings.saveFailed;
      setError(message);
      pushToast(message, "danger");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">{t.settings.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t.settings.subtitle(session?.user?.email ?? t.settings.yourAccount)}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.notifications}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-1">
              <Label htmlFor="emailNotifications">{t.settings.emailNotifications}</Label>
              <p className="text-muted-foreground text-sm">{t.settings.emailNotificationsHint}</p>
            </div>
            <Switch
              id="emailNotifications"
              checked={emailNotifications}
              disabled={settingsQuery.isLoading || updateSettings.isPending}
              onCheckedChange={(checked) => void toggleEmailNotifications(checked)}
            />
          </div>

          {settingsQuery.error ? (
            <p className="text-destructive text-sm">{settingsQuery.error.message}</p>
          ) : null}
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </CardContent>
      </Card>

      <DashboardCalendarCard />

      <ChangePasswordCard />
    </div>
  );
}

/**
 * Default scope of the dashboard calendar. Only groups the caller may view in
 * full are offered — the API rejects anything else, so the picker must not
 * suggest it.
 */
function DashboardCalendarCard() {
  const { t } = useTranslation();
  const settingsQuery = useMySettings();
  const scopeQuery = useReportScope();
  const updateSettings = useUpdateMySettings();

  const [error, setError] = useState<string | null>(null);
  // Edits are held until Save; `null` means "no edits yet, show what is stored".
  const [draft, setDraft] = useState<{
    dashboardScope: DashboardScope;
    dashboardGroupId: string | null;
  } | null>(null);

  const viewableGroups = useMemo(
    () => (scopeQuery.data?.groups ?? []).filter((g) => g.access === "all"),
    [scopeQuery.data]
  );

  const storedScope: DashboardScope = settingsQuery.data?.dashboardScope ?? "MINE";
  const storedGroupId = settingsQuery.data?.dashboardGroupId ?? null;
  const scope = draft?.dashboardScope ?? storedScope;
  const groupId = draft ? draft.dashboardGroupId : storedGroupId;
  const busy = settingsQuery.isLoading || updateSettings.isPending;
  const dirty = draft !== null && (scope !== storedScope || groupId !== storedGroupId);

  function edit(
    next: Partial<{ dashboardScope: DashboardScope; dashboardGroupId: string | null }>
  ) {
    setError(null);
    setDraft({ dashboardScope: scope, dashboardGroupId: groupId, ...next });
  }

  // Group scope with nothing chosen would be rejected by the API, so the first
  // viewable group comes along with the switch.
  function selectScope(next: DashboardScope) {
    if (next === scope) return;
    if (next === "GROUP" && !groupId) {
      const first = viewableGroups[0];
      if (!first) return;
      edit({ dashboardScope: "GROUP", dashboardGroupId: first.groupId });
      return;
    }
    edit({ dashboardScope: next });
  }

  async function save() {
    setError(null);
    try {
      await updateSettings.mutateAsync({
        dashboardScope: scope,
        dashboardGroupId: groupId,
      });
      setDraft(null);
      pushToast(t.common.saved);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.settings.saveFailed;
      setError(message);
      pushToast(message, "danger");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.settings.dashboardCalendar}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>{t.settings.dashboardScope}</Label>
          <p className="text-muted-foreground text-sm">{t.settings.dashboardScopeHint}</p>
          <div className="flex gap-2 pt-1">
            {(["MINE", "GROUP"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={scope === value}
                disabled={busy || (value === "GROUP" && viewableGroups.length === 0)}
                onClick={() => selectScope(value)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  scope === value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:ring-foreground/30 hover:ring-1"
                )}
              >
                {value === "MINE" ? t.settings.scopeMine : t.settings.scopeGroup}
              </button>
            ))}
          </div>
        </div>

        {viewableGroups.length === 0 && !scopeQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">{t.settings.noViewableGroups}</p>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="dashboardGroup">{t.settings.dashboardGroup}</Label>
            <Select
              value={groupId ?? ""}
              disabled={busy || scope === "MINE"}
              onValueChange={(value) => edit({ dashboardGroupId: value })}
            >
              <SelectTrigger
                id="dashboardGroup"
                className="w-[260px]"
                aria-label={t.settings.dashboardGroup}
              >
                <SelectValue placeholder={t.settings.dashboardGroupPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {viewableGroups.map((group) => (
                  <SelectItem key={group.groupId} value={group.groupId}>
                    {group.groupName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-sm">{t.settings.dashboardGroupHint}</p>
          </div>
        )}

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        <div className="flex items-center gap-3">
          <Button onClick={() => void save()} disabled={busy || !dirty}>
            {updateSettings.isPending ? t.common.saving : t.common.save}
          </Button>
          {dirty ? (
            <Button variant="ghost" onClick={() => setDraft(null)} disabled={busy}>
              {t.common.cancel}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function ChangePasswordCard() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError(t.settings.passwordTooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t.settings.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) {
        setError(result.error.message ?? t.settings.changePasswordFailed);
        return;
      }
      setSuccess(t.settings.passwordChanged);
      pushToast(t.settings.passwordChanged);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settings.changePasswordFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.settings.changePassword}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">{t.settings.currentPassword}</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">{t.settings.newPassword}</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder={t.settings.newPasswordPlaceholder}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">{t.settings.confirmNewPassword}</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder={t.settings.confirmPlaceholder}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          {success ? <p className="text-sm text-green-700 dark:text-green-400">{success}</p> : null}

          <Button type="submit" disabled={loading}>
            {loading ? t.common.saving : t.settings.changePassword}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
