"use client";

// PROTOTYPE (T-680): the viewer's own AI connections in account settings, ?ai=empty for none.
// Lives on prototype/* branches only. Nothing here calls the backend.

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MY_CONNECTIONS } from "@/components/ai-settings/prototype/data";
import { AccessLabel, AppCell, Muted } from "@/components/ai-settings/prototype/parts";

const SERVER_URL = "https://api.flexi-day.com/mcp";

export function MyAiConnectionsCard() {
  const params = useSearchParams();
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState<string | null>(null);
  const rows = params.get("ai") === "empty" ? [] : MY_CONNECTIONS.filter((c) => !gone.has(c.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI connections</CardTitle>
        <Muted>
          AI apps you allowed to use Flexi Day for you. Each one works in one organization, with
          your permissions there.
        </Muted>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.length === 0 ? (
          <Muted>You haven&apos;t connected an AI app.</Muted>
        ) : (
          <ul>
            {rows.map((c) => (
              <li
                key={c.id}
                className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b py-3 last:border-0"
              >
                <AppCell app={c.app} />
                <div className="row-span-2 flex justify-end">
                  {confirming === c.id ? (
                    <span className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setGone(new Set(gone).add(c.id));
                          setConfirming(null);
                        }}
                      >
                        Disconnect
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
                        Keep
                      </Button>
                    </span>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setConfirming(c.id)}>
                      Disconnect
                    </Button>
                  )}
                </div>
                <p className="text-muted-foreground pl-[38px] text-sm">
                  {c.org} · <AccessLabel access={c.access} /> · last used {c.lastUsed}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-lg bg-[var(--surface-2)] px-4 py-3">
          <p className="text-sm font-medium">Connect an AI app</p>
          <p className="text-muted-foreground mt-0.5 text-sm">
            In Claude, ChatGPT or another app that takes MCP connectors, add Flexi Day with this
            address. Your organization&apos;s owner has to turn on AI connections first.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="rounded-md bg-[var(--surface)] px-2.5 py-1.5 text-sm">
              {SERVER_URL}
            </code>
            <Button size="sm" variant="ghost" aria-label="Copy the address">
              <Copy className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
