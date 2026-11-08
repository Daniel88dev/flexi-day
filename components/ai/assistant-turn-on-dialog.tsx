"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { pushToast } from "@/components/toast";
import { errorCopy } from "@/lib/api/client";
import { formatUsd, nextWeeklyReset, type AiSettings } from "@/lib/api/ai-settings";
import { useEnableAssistant } from "@/lib/api/queries";
import { formatDate } from "@/lib/directory/format";
import { useTranslation } from "@/lib/i18n/use-translation";
import { AI_AGREEMENT_VERSION, legalHref } from "@/lib/legal";

/** The Weekly limit's reset as the viewer's own weekday and time. */
const resetLabel = (dateLocale: string) =>
  new Intl.DateTimeFormat(dateLocale, {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(nextWeeklyReset(new Date()));

export function AssistantTurnOnDialog({
  open,
  onOpenChange,
  settings,
  organizationName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AiSettings;
  organizationName: string;
}) {
  const { t, locale } = useTranslation();
  const copy = t.aiSettings.turnOn;
  const enable = useEnableAssistant(settings.organizationId);
  const { agreement } = settings;
  const alreadyAccepted = agreement.acceptedVersion === AI_AGREEMENT_VERSION;
  const [accepted, setAccepted] = useState(false);
  const [tellMembers, setTellMembers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setAccepted(false);
    setTellMembers(true);
    setError(null);
  }

  async function submit() {
    setError(null);
    try {
      await enable.mutateAsync({ agreementVersion: AI_AGREEMENT_VERSION, tellMembers });
      pushToast(copy.done);
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(
        errorCopy(
          err,
          {
            AGREEMENT_VERSION_STALE: copy.stale,
            ASSISTANT_ALREADY_ON: copy.alreadyOn,
            ASSISTANT_PLAN_REQUIRED: t.aiSettings.card.comesWithEnterprise,
          },
          copy.failed
        )
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>{copy.title(organizationName)}</DialogTitle>
          <DialogDescription>{copy.lead}</DialogDescription>
        </DialogHeader>

        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[170px_1fr]">
          {copy
            .facts(
              organizationName,
              resetLabel(t.common.dateLocale),
              formatUsd(locale, settings.assistant.weeklyLimitMicroUsd)
            )
            .map(([term, text]) => (
              <div key={term} className="contents">
                <dt className="text-sm font-semibold">{term}</dt>
                <dd className="text-sm leading-relaxed">{text}</dd>
              </div>
            ))}
        </dl>

        <div className="bg-muted/50 space-y-2 rounded-[var(--radius-sm)] p-3 text-sm">
          <p>{copy.subProcessor}</p>
          <Link
            href={legalHref("ai-agreement", locale)}
            target="_blank"
            rel="noopener"
            className="text-primary font-semibold underline-offset-2 hover:underline"
          >
            {copy.readAgreement}
          </Link>
        </div>

        {alreadyAccepted && agreement.acceptedAt ? (
          <p className="text-muted-foreground text-xs">
            {t.aiSettings.accepted(
              AI_AGREEMENT_VERSION,
              agreement.acceptedByName,
              formatDate(agreement.acceptedAt, t.common.dateLocale)
            )}
          </p>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Checkbox
                id="acceptAiAgreement"
                checked={accepted}
                onCheckedChange={(next) => setAccepted(next === true)}
              />
              <Label htmlFor="acceptAiAgreement">{copy.accept(organizationName)}</Label>
            </div>
            <p className="text-muted-foreground text-xs">{copy.recordHint}</p>
          </div>
        )}

        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Checkbox
              id="tellAssistantMembers"
              checked={tellMembers}
              onCheckedChange={(next) => setTellMembers(next === true)}
            />
            <Label htmlFor="tellAssistantMembers">{copy.tellMembers}</Label>
          </div>
          <p className="text-muted-foreground text-xs">{copy.tellMembersHint}</p>
        </div>

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {copy.cancel}
          </Button>
          <Button
            disabled={(!alreadyAccepted && !accepted) || enable.isPending}
            onClick={() => void submit()}
          >
            {enable.isPending ? copy.working : alreadyAccepted ? copy.turnOn : copy.acceptAndTurnOn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
