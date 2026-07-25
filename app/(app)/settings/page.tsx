"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMySettings, useUpdateMySettings } from "@/lib/api/queries";
import { changePassword, useSession } from "@/lib/auth-client";

export default function SettingsPage() {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Preferences for {session?.user?.email ?? "your account"}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-1">
              <Label htmlFor="emailNotifications">Email notifications</Label>
              <p className="text-muted-foreground text-sm">
                Approval requests, decisions on your requests, and cancellations of approved time
                off. Turning this off keeps them in the app only — account emails such as address
                confirmation always send.
              </p>
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

      <ChangePasswordCard />
    </div>
  );
}

function ChangePasswordCard() {
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
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
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
        setError(result.error.message ?? "Could not change password.");
        return;
      }
      setSuccess("Password changed.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current password</Label>
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
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          {success ? (
            <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
          ) : null}

          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Change password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
