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
import { dailyAiConnectionLimit, MEMBER_DAILY_LIMIT, type AiSettings } from "@/lib/api/ai-settings";
import { useEnableAiConnections } from "@/lib/api/queries";
import { formatDate } from "@/lib/directory/format";
import { useTranslation } from "@/lib/i18n/use-translation";
import { AI_AGREEMENT_VERSION, legalHref } from "@/lib/legal";
import { cn } from "@/lib/utils";

type Level = "read" | "write";

export function AiConnectionsTurnOnDialog({
  open,
  onOpenChange,
  settings,
  organizationName,
  initialLevel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AiSettings;
  organizationName: string;
  /** The level the owner picked on the card; "Start with" opens on it. Key the dialog on it. */
  initialLevel: Level;
}) {
  const { t, locale } = useTranslation();
  const copy = t.aiConnectionsSettings.turnOn;
  const shared = t.aiSettings.turnOn;
  const enable = useEnableAiConnections(settings.organizationId);
  const { agreement } = settings;
  const alreadyAccepted = agreement.acceptedVersion === AI_AGREEMENT_VERSION;
  const [level, setLevel] = useState<Level>(initialLevel);
  const [accepted, setAccepted] = useState(false);
  const [tellMembers, setTellMembers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const count = new Intl.NumberFormat(t.common.dateLocale);
  const limits = {
    organization: count.format(dailyAiConnectionLimit(settings.plan)),
    member: count.format(MEMBER_DAILY_LIMIT),
  };

  function reset() {
    setLevel(initialLevel);
    setAccepted(false);
    setTellMembers(true);
    setError(null);
  }

  async function submit() {
    setError(null);
    try {
      await enable.mutateAsync({ level, agreementVersion: AI_AGREEMENT_VERSION, tellMembers });
      pushToast(copy.done);
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(
        errorCopy(
          err,
          {
            AGREEMENT_VERSION_STALE: shared.stale,
            AI_CONNECTIONS_ALREADY_ON: copy.alreadyOn,
            AI_CONNECTIONS_PLAN_REQUIRED: t.aiConnectionsSettings.card.comesWithPaid,
          },
          copy.failed
        )
      );
    }
  }

  const levelLabels = t.aiConnectionsSettings.card.levels;

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
          {copy.facts(organizationName, limits).map(([term, text]) => (
            <div key={term} className="contents">
              <dt className="text-sm font-semibold">{term}</dt>
              <dd className="text-sm leading-relaxed">{text}</dd>
            </div>
          ))}
        </dl>

        <div role="radiogroup" aria-labelledby="aiConnectionsStartWith" className="space-y-2">
          <p id="aiConnectionsStartWith" className="text-sm font-semibold">
            {copy.startWith}
          </p>
          {(["read", "write"] as const).map((key) => (
            <label
              key={key}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3",
                level === key ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              <input
                type="radio"
                name="aiConnectionsStartWith"
                className="accent-primary mt-1"
                checked={level === key}
                onChange={() => setLevel(key)}
              />
              <span className="space-y-0.5">
                <span className="block text-sm font-medium">{levelLabels[key]}</span>
                <span className="text-muted-foreground block text-sm">
                  {key === "read" ? copy.readHint : copy.writeHint}
                </span>
              </span>
            </label>
          ))}
        </div>

        <div className="bg-muted/50 rounded-[var(--radius-sm)] p-3 text-sm">
          <Link
            href={legalHref("ai-agreement", locale)}
            target="_blank"
            rel="noopener"
            className="text-primary font-semibold underline-offset-2 hover:underline"
          >
            {shared.readAgreement}
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
                id="acceptAiAgreementForConnections"
                checked={accepted}
                onCheckedChange={(next) => setAccepted(next === true)}
              />
              <Label htmlFor="acceptAiAgreementForConnections">
                {shared.accept(organizationName)}
              </Label>
            </div>
            <p className="text-muted-foreground text-xs">{shared.recordHint}</p>
          </div>
        )}

        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Checkbox
              id="tellAiConnectionsMembers"
              checked={tellMembers}
              onCheckedChange={(next) => setTellMembers(next === true)}
            />
            <Label htmlFor="tellAiConnectionsMembers">{shared.tellMembers}</Label>
          </div>
          <p className="text-muted-foreground text-xs">{shared.tellMembersHint}</p>
        </div>

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {shared.cancel}
          </Button>
          <Button
            disabled={(!alreadyAccepted && !accepted) || enable.isPending}
            onClick={() => void submit()}
          >
            {enable.isPending
              ? copy.working
              : alreadyAccepted
                ? copy.turnOn
                : shared.acceptAndTurnOn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
