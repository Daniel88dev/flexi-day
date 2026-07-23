"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMySettings, useUpdateMySettings } from "@/lib/api/queries";
import { useSession } from "@/lib/auth-client";

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
    </div>
  );
}
