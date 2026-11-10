"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyText, pushToast } from "@/components/toast";
import { AiConnectionsTurnOnDialog } from "@/components/ai/ai-connections-turn-on-dialog";
import { AiConnectionsLowerDialog } from "@/components/ai/ai-connections-lower-dialog";
import { errorCopy } from "@/lib/api/client";
import { memberNoticeText, type AiConnectionsLevel, type AiSettings } from "@/lib/api/ai-settings";
import { useSetAiConnectionsLevel } from "@/lib/api/queries";
import { formatDate } from "@/lib/directory/format";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

const LEVELS: AiConnectionsLevel[] = ["off", "read", "write"];

/** The AI connections half of the AI card: Off, Read only, Read and write. Owner only. */
export function AiConnectionsControl({
  settings,
  organizationName,
}: {
  settings: AiSettings;
  organizationName: string;
}) {
  const { t, locale } = useTranslation();
  const copy = t.aiConnectionsSettings.card;
  const raise = useSetAiConnectionsLevel(settings.organizationId);
  const [turnOnAt, setTurnOnAt] = useState<"read" | "write" | null>(null);
  const [lowerTo, setLowerTo] = useState<"read" | "off" | null>(null);
  const { isOwner, agreement } = settings;
  const { level, planAllows } = settings.aiConnections;
  const on = level !== "off";
  const lead = !planAllows && !on ? copy.planLead : copy[`${level}Lead`];

  // A lapsed plan may still lower or turn off; Free with nothing on shows it all disabled.
  const canChoose = (next: AiConnectionsLevel) =>
    isOwner && (planAllows || (on && LEVELS.indexOf(next) <= LEVELS.indexOf(level)));

  async function choose(next: AiConnectionsLevel) {
    if (next === level) return;
    if (level === "off") {
      setTurnOnAt(next === "write" ? "write" : "read");
    } else if (next === "write") {
      try {
        await raise.mutateAsync("write");
        pushToast(copy.raised);
      } catch (err) {
        pushToast(errorCopy(err, {}, copy.raiseFailed));
      }
    } else {
      setLowerTo(next === "off" ? "off" : "read");
    }
  }

  async function copyNotice() {
    await copyText(memberNoticeText(settings.memberNotice.aiConnections[locale]));
    pushToast(t.aiSettings.card.copied);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold">{copy.title}</p>
        <p className="text-muted-foreground text-sm">{lead}</p>
      </div>

      <div
        role="radiogroup"
        aria-label={copy.title}
        className="inline-flex rounded-lg bg-[var(--surface-2)] p-1"
      >
        {LEVELS.map((key) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={level === key}
            disabled={!canChoose(key) || raise.isPending}
            onClick={() => void choose(key)}
            className={cn(
              "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed",
              level === key
                ? "text-foreground bg-[var(--surface)] shadow-sm"
                : "text-muted-foreground hover:text-foreground disabled:hover:text-muted-foreground"
            )}
          >
            {copy.levels[key]}
          </button>
        ))}
      </div>

      {!planAllows && !on ? (
        <div className="rounded-lg bg-[var(--surface-2)] px-4 py-3">
          <p className="text-sm">{copy.comesWithPaid}</p>
          {isOwner ? (
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link href="/billing">{t.aiSettings.card.seePlans}</Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      {on &&
      !settings.assistant.enabled &&
      agreement.acceptedVersion !== null &&
      agreement.acceptedAt ? (
        <p className="text-muted-foreground text-xs">
          {t.aiSettings.accepted(
            agreement.acceptedVersion,
            agreement.acceptedByName,
            formatDate(agreement.acceptedAt, t.common.dateLocale)
          )}
        </p>
      ) : null}

      {on ? (
        <Button size="sm" variant="outline" onClick={() => void copyNotice()}>
          <Copy className="h-3.5 w-3.5" aria-hidden />
          {t.aiSettings.card.copyNotice}
        </Button>
      ) : null}

      {!isOwner ? (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Lock className="size-3.5" aria-hidden />
          {t.aiSettings.card.ownerOnly(settings.ownerName)}
        </p>
      ) : null}

      {isOwner ? (
        <>
          <AiConnectionsTurnOnDialog
            key={turnOnAt ?? "closed"}
            open={turnOnAt !== null}
            onOpenChange={(open) => {
              if (!open) setTurnOnAt(null);
            }}
            settings={settings}
            organizationName={organizationName}
            initialLevel={turnOnAt ?? "read"}
          />
          <AiConnectionsLowerDialog
            target={lowerTo}
            onOpenChange={(open) => {
              if (!open) setLowerTo(null);
            }}
            organizationId={settings.organizationId}
            grants={settings.aiConnections.grants}
          />
        </>
      ) : null}
    </div>
  );
}
