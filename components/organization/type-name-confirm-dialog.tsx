"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/use-translation";
import { sameName } from "@/lib/same-name";

/**
 * A destructive confirm that only goes ahead once `name` is typed. `onConfirm` gets the typed
 * text; the dialog closes when it resolves and shows `failureMessage(error)` when it rejects.
 */
export function TypeNameConfirmDialog({
  open,
  onOpenChange,
  name,
  inputId,
  title,
  description,
  nameLabel,
  mismatch,
  confirmLabel,
  pending,
  onConfirm,
  failureMessage,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  inputId: string;
  title: string;
  description: string;
  nameLabel: string;
  mismatch: string;
  confirmLabel: string;
  pending: boolean;
  onConfirm: (typed: string) => Promise<void>;
  failureMessage: (error: unknown) => string;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);

  const change = (next: boolean) => {
    if (!next) {
      setTyped("");
      setError(null);
    }
    onOpenChange(next);
  };

  async function submit() {
    setError(null);
    if (!sameName(typed, name)) {
      setError(mismatch);
      return;
    }
    try {
      await onConfirm(typed);
    } catch (err) {
      setError(failureMessage(err));
      return;
    }
    change(false);
  }

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <div className="space-y-2">
          <Label htmlFor={inputId}>{nameLabel}</Label>
          <Input
            id={inputId}
            autoComplete="off"
            value={typed}
            onChange={(event) => {
              setTyped(event.target.value);
              setError(null);
            }}
          />
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => change(false)}>
            {t.common.cancel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending || typed.trim() === ""}
            onClick={() => void submit()}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
