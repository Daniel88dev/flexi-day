"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { copyText, pushToast } from "@/components/toast";
import { AssistantTurnOnDialog } from "@/components/ai/assistant-turn-on-dialog";
import { AssistantTurnOffDialog } from "@/components/ai/assistant-turn-off-dialog";
import { AiConnectionsControl } from "@/components/ai/ai-connections-control";
import { AiFeatureGate } from "@/components/ai/ai-feature-gate";
import { memberNoticeText, type AiSettings } from "@/lib/api/ai-settings";
import { useAiSettings } from "@/lib/api/queries";
import { formatDate } from "@/lib/directory/format";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * The AI card on the Organization page: the Assistant switch and the AI
 * connections setting side by side, owner only. Each half shows only while its
 * feature is available to the organization.
 */
export function AiCard({
  organizationId,
  organizationName,
}: {
  organizationId: string;
  organizationName: string;
}) {
  const { t } = useTranslation();
  const copy = t.aiSettings.card;
  const query = useAiSettings(organizationId);
  const settings = query.data;

  return (
    <Card className="md:col-span-2">
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="flex items-center gap-2" role="heading" aria-level={2}>
          <Sparkles className="h-4 w-4" aria-hidden />
          {copy.title}
        </CardTitle>
        {settings && settings.plan !== "FREE" ? (
          <Button asChild size="sm" variant="outline">
            <Link href="/ai-usage">{copy.seeUsage}</Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-8 md:grid-cols-2">
        {query.isLoading ? (
          <p className="text-muted-foreground text-sm">{t.common.loading}</p>
        ) : !settings ? (
          <p className="text-destructive text-sm">{copy.loadFailed}</p>
        ) : (
          <>
            <AiFeatureGate feature="assistant" organizationId={organizationId}>
              <AssistantControl settings={settings} organizationName={organizationName} />
            </AiFeatureGate>
            <AiFeatureGate feature="aiConnections" organizationId={organizationId}>
              <AiConnectionsControl settings={settings} organizationName={organizationName} />
            </AiFeatureGate>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AssistantControl({
  settings,
  organizationName,
}: {
  settings: AiSettings;
  organizationName: string;
}) {
  const { t, locale } = useTranslation();
  const copy = t.aiSettings.card;
  const [dialog, setDialog] = useState<"on" | "off" | null>(null);
  const { assistant, agreement, isOwner } = settings;
  const enabled = assistant.enabled;
  const canChange = isOwner && (enabled || assistant.planAllows);
  const lead =
    !assistant.planAllows && !enabled ? copy.planLead : enabled ? copy.onLead : copy.offLead;

  async function copyNotice() {
    await copyText(memberNoticeText(settings.memberNotice.assistant[locale]));
    pushToast(copy.copied);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1">
          <p className="text-sm font-semibold">{copy.assistant}</p>
          <p className="text-muted-foreground text-sm">{lead}</p>
        </div>
        <Switch
          checked={enabled}
          disabled={!canChange}
          aria-label={copy.assistant}
          onCheckedChange={(next) => setDialog(next ? "on" : "off")}
        />
      </div>

      {!assistant.planAllows && !enabled ? (
        <div className="rounded-lg bg-[var(--surface-2)] px-4 py-3">
          <p className="text-sm">{copy.comesWithEnterprise}</p>
          {isOwner ? (
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link href="/billing">
                {settings.plan === "FREE" ? copy.seePlans : copy.seeEnterprise}
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      {enabled && agreement.acceptedVersion !== null && agreement.acceptedAt ? (
        <p className="text-muted-foreground text-xs">
          {t.aiSettings.accepted(
            agreement.acceptedVersion,
            agreement.acceptedByName,
            formatDate(agreement.acceptedAt, t.common.dateLocale)
          )}
        </p>
      ) : null}

      {enabled ? (
        <Button size="sm" variant="outline" onClick={() => void copyNotice()}>
          <Copy className="h-3.5 w-3.5" aria-hidden />
          {copy.copyNotice}
        </Button>
      ) : null}

      {!isOwner ? (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Lock className="size-3.5" aria-hidden />
          {copy.ownerOnly(settings.ownerName)}
        </p>
      ) : null}

      {isOwner ? (
        <>
          <AssistantTurnOnDialog
            open={dialog === "on"}
            onOpenChange={(open) => setDialog(open ? "on" : null)}
            settings={settings}
            organizationName={organizationName}
          />
          <AssistantTurnOffDialog
            open={dialog === "off"}
            onOpenChange={(open) => setDialog(open ? "off" : null)}
            organizationId={settings.organizationId}
          />
        </>
      ) : null}
    </div>
  );
}
