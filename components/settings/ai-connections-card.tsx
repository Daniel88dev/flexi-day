"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { AiFeatureGate } from "@/components/ai/ai-feature-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { copyText, pushToast } from "@/components/toast";
import { errorCopy } from "@/lib/api/client";
import { appLabel, type MyAiConnection } from "@/lib/api/ai-connections";
import { useDisconnectAiConnection, useMyAiConnections } from "@/lib/api/queries";
import { relativeTime } from "@/lib/calendar-sync/relative-time";
import { useTranslation } from "@/lib/i18n/use-translation";

/** The Settings card, shown while AI connections are available in any of the caller's organizations. */
export function GatedAiConnectionsCard() {
  return (
    <AiFeatureGate feature="aiConnections">
      <AiConnectionsCard />
    </AiFeatureGate>
  );
}

/** The signed-in user's own AI connections, with Disconnect and the server address. */
export function AiConnectionsCard() {
  const { t } = useTranslation();
  const copy = t.aiConnectionGrants.settings;
  const query = useMyAiConnections();
  const disconnect = useDisconnectAiConnection();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function confirmDisconnect(connection: MyAiConnection) {
    setError(null);
    try {
      await disconnect.mutateAsync(connection.grantId);
      setConfirming(null);
      pushToast(copy.disconnected(appLabel(connection.app)));
    } catch (err) {
      setError(errorCopy(err, {}, copy.disconnectFailed));
    }
  }

  async function copyAddress(serverUrl: string) {
    await copyText(serverUrl);
    pushToast(copy.copied);
  }

  const connections = query.data?.connections ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <p className="text-muted-foreground text-sm">{copy.lead}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {query.isError ? (
          <p className="text-destructive text-sm">{copy.loadFailed}</p>
        ) : query.isPending ? null : connections.length === 0 ? (
          <p className="text-muted-foreground text-sm">{copy.empty}</p>
        ) : (
          <ul aria-label={copy.title}>
            {connections.map((connection) => {
              const name = appLabel(connection.app);
              return (
                <li
                  key={connection.grantId}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b py-3 last:border-0"
                >
                  <span className="leading-tight">
                    <span className="block font-medium">{name}</span>
                    <span className="text-muted-foreground block text-xs">
                      {connection.app.host}
                      {connection.app.verified ? null : ` · ${copy.notVerified}`}
                    </span>
                  </span>
                  <div className="row-span-2 flex justify-end">
                    {confirming === connection.grantId ? (
                      <span className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={disconnect.isPending}
                          onClick={() => void confirmDisconnect(connection)}
                        >
                          {disconnect.isPending ? copy.disconnecting : copy.disconnect}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setConfirming(null);
                            setError(null);
                          }}
                        >
                          {copy.keep}
                        </Button>
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={copy.disconnectApp(name)}
                        onClick={() => {
                          setConfirming(connection.grantId);
                          setError(null);
                        }}
                      >
                        {copy.disconnect}
                      </Button>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {connection.organizationName ?? copy.organizationGone} ·{" "}
                    {copy.access[connection.access]} ·{" "}
                    {copy.lastUsed(relativeTime(connection.lastUsedAt, t))}
                  </p>
                  {confirming === connection.grantId ? (
                    <p className="col-span-2 text-sm font-medium">{copy.confirm(name)}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        {query.data ? (
          <div className="rounded-lg bg-[var(--surface-2)] px-4 py-3">
            <p className="text-sm font-medium">{copy.connectTitle}</p>
            <p className="text-muted-foreground mt-0.5 text-sm">{copy.connectLead}</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="rounded-md bg-[var(--surface)] px-2.5 py-1.5 text-sm break-all">
                {query.data.serverUrl}
              </code>
              <Button
                size="sm"
                variant="ghost"
                aria-label={copy.copy}
                onClick={() => void copyAddress(query.data.serverUrl)}
              >
                <Copy className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
