"use client";

import { useId, useRef, type KeyboardEvent } from "react";
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

/** The scope a dialog opens on: the first one allowed, "This event" first unless the rule changed. */
export function initialScope(ruleChanged: boolean, followingAllowed: boolean): GroupEventScope {
  if (!ruleChanged) return "this";
  return followingAllowed ? "following" : "all";
}

/**
 * Asks which dates a save or delete applies to. Without `recurring` it is a plain confirm. The
 * parent holds the scope and passes `dropped` for it, so the user sees the count before confirming.
 */
export function ScopeDialog({
  action,
  title,
  occurrenceDate,
  recurring,
  scope,
  onScopeChange,
  ruleChanged = false,
  followingDisabledReason = null,
  busy = false,
  error,
  dropped,
  checking = false,
  impactFailed = false,
  onRetryImpact,
  onCancel,
  onConfirm,
}: {
  action: "edit" | "delete";
  title: string;
  occurrenceDate: IsoDate;
  recurring: boolean;
  scope: GroupEventScope;
  onScopeChange: (scope: GroupEventScope) => void;
  ruleChanged?: boolean;
  /** Set when "This and following" can't be offered, saying why. */
  followingDisabledReason?: string | null;
  busy?: boolean;
  error?: string | null;
  dropped?: number;
  checking?: boolean;
  /** The count of dropped changes could not be fetched; Save waits for a retry. */
  impactFailed?: boolean;
  onRetryImpact?: () => void;
  onCancel: () => void;
  onConfirm: (scope: GroupEventScope | undefined) => void;
}) {
  const { t } = useTranslation();
  const labels = t.groupEvents.scope;
  const titleId = useId();
  const radiosRef = useRef<Partial<Record<GroupEventScope, HTMLButtonElement | null>>>({});
  const date = cardDate(occurrenceDate, t);
  const options: Record<GroupEventScope, [string, string]> = {
    this: [labels.thisEvent, labels.onlyDate(date)],
    following: [labels.following, labels.fromDate(date)],
    all: [labels.all, labels.everyDate],
  };
  const reasonFor = (value: GroupEventScope): string | null => {
    if (value === "this" && ruleChanged) return labels.ruleOnOneDate;
    if (value === "following") return followingDisabledReason;
    return null;
  };
  const enabled = SCOPES.filter((value) => reasonFor(value) === null);

  function onRadioKey(e: KeyboardEvent<HTMLButtonElement>) {
    const step =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? 1
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? -1
          : 0;
    if (step === 0) return;
    e.preventDefault();
    const at = enabled.indexOf(scope);
    const next = enabled[(at + step + enabled.length) % enabled.length];
    if (!next) return;
    onScopeChange(next);
    radiosRef.current[next]?.focus();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onCancel()}>
      <DialogContent role="alertdialog" className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle id={titleId}>
            {action === "delete" ? labels.deleteTitle(title) : labels.changeTitle(title)}
          </DialogTitle>
          <DialogDescription>
            {action === "delete" ? labels.deleteBody : labels.changeQuestion}
          </DialogDescription>
        </DialogHeader>
        {recurring ? (
          <div role="radiogroup" aria-labelledby={titleId} className="grid gap-1.5">
            {SCOPES.map((value) => {
              const reason = reasonFor(value);
              const [label, sub] = options[value];
              const checked = scope === value;
              return (
                <button
                  key={value}
                  ref={(el) => {
                    radiosRef.current[value] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  tabIndex={checked ? 0 : -1}
                  disabled={reason !== null}
                  onClick={() => onScopeChange(value)}
                  onKeyDown={onRadioKey}
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
                      {reason ?? sub}
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
        ) : impactFailed ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-destructive text-[12.5px]">{labels.impactFailed}</p>
            <Button size="sm" variant="outline" onClick={onRetryImpact}>
              {labels.retry}
            </Button>
          </div>
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
            disabled={busy || checking || impactFailed}
            onClick={() => onConfirm(recurring ? scope : undefined)}
          >
            {action === "delete" ? labels.deleteConfirm : t.groupEvents.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
