"use client";

import { useState, type ReactNode } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pushToast } from "@/components/toast";
import { downloadAccountExport } from "@/lib/api/account-export";
import { saveBlob } from "@/lib/api/reports";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * Copies of the data held about the signed-in user. The Account export is always here;
 * `children` carries further entries, such as each organization's person export.
 */
export function YourDataCard({ children }: { children?: ReactNode }) {
  const { t } = useTranslation();
  const d = t.settings.yourData;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const file = await downloadAccountExport();
      saveBlob(file.blob, file.filename);
      pushToast(d.downloaded);
    } catch (err) {
      const message = err instanceof Error ? err.message : d.failed;
      setError(message);
      pushToast(message, "danger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{d.title}</CardTitle>
        <CardDescription>{d.hint}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">{d.accountData}</p>
            <p className="text-muted-foreground text-sm">{d.accountDataHint}</p>
          </div>
          <Button variant="outline" onClick={() => void download()} disabled={busy}>
            <Download className="h-4 w-4" />
            {busy ? d.downloading : d.download}
          </Button>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
