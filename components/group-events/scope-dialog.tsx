"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GroupEventScope } from "@/lib/api/group-events";
import type { IsoDate } from "@/lib/api/types";
import { cardDate } from "@/lib/group-events/labels";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

const SCOPES: GroupEventScope[] = ["this", "following", "all"];

/**
 * Asks which dates a save or delete applies to. Without `recurring` it is a plain confirm. The
 * parent passes `dropped` for the scope picked, so the user sees the count before confirming.
 */
export function ScopeDialog({
  action,
  title,
  occurrenceDate,
  recurring,
  ruleChanged = false,
  busy = false,
  error,
  dropped,
  checking = false,
  onScopeChange,
  onCancel,
  onConfirm,
}: {
  action: "edit" | "delete";
  title: string;
  occurrenceDate: IsoDate;
  recurring: boolean;
  ruleChanged?: boolean;
  busy?: boolean;
  error?: string | null;
  dropped?: number;
  checking?: boolean;
  onScopeChange?: (scope: GroupEventScope) => void;
  onCancel: () => void;
  onConfirm: (scope: GroupEventScope | undefined) => void;
}) {
  const { t } = useTranslation();
  const labels = t.groupEvents.scope;
  const [scope, setScope] = useState<GroupEventScope>(ruleChanged ? "following" : "this");
  const date = cardDate(occurrenceDate, t);
  const options: Record<GroupEventScope, [string, string]> = {
    this: [labels.thisEvent, labels.onlyDate(date)],
    following: [labels.following, labels.fromDate(date)],
    all: [labels.all, labels.everyDate],
  };

  function pick(next: GroupEventScope) {
    setScope(next);
    onScopeChange?.(next);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onCancel()}>
      <DialogContent role="alertdialog" className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {action === "delete" ? labels.deleteTitle(title) : labels.changeTitle(title)}
          </DialogTitle>
          <DialogDescription>
            {action === "delete" ? labels.deleteBody : labels.changeQuestion}
          </DialogDescription>
        </DialogHeader>
        {recurring ? (
          <div role="radiogroup" className="grid gap-1.5">
            {SCOPES.map((value) => {
              const disabled = ruleChanged && value === "this";
              const [label, sub] = options[value];
              const checked = scope === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  disabled={disabled}
                  onClick={() => pick(value)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors disabled:opacity-50",
                    checked ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1 size-3.5 shrink-0 rounded-full border-2",
                      checked ? "border-primary bg-primary" : "border-border"
                    )}
                  />
                  <span>
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="block text-[12.5px]" style={{ color: "var(--text-muted)" }}>
                      {disabled ? labels.ruleOnOneDate : sub}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
        {checking ? (
          <p className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>
            {labels.checking}
          </p>
        ) : dropped ? (
          <p
            className="rounded-xl px-3 py-2 text-[12.5px]"
            style={{ background: "var(--warm-soft)", color: "var(--text)" }}
          >
            {labels.dropped(dropped)}
          </p>
        ) : null}
        {error ? <p className="text-destructive text-[12.5px]">{error}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            {t.groupEvents.cancel}
          </Button>
          <Button
            variant={action === "delete" ? "destructive" : "default"}
            disabled={busy || checking}
            onClick={() => onConfirm(recurring ? scope : undefined)}
          >
            {action === "delete" ? labels.deleteConfirm : t.groupEvents.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
