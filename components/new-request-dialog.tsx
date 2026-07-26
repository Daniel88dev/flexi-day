"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateVacation, useGroups } from "@/lib/api/queries";
import { ApiError } from "@/lib/api/client";
import { VacationKind } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatIsoDay(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

function extractConflictingDays(err: ApiError): string[] {
  const ctx = err.context<{ conflictingDays?: unknown }>();
  const raw = ctx?.conflictingDays;
  if (!Array.isArray(raw)) return [];
  return raw.filter((d): d is string => typeof d === "string");
}

const REQUESTABLE_KINDS: VacationKind[] = [
  VacationKind.Vacation,
  VacationKind.HomeOffice,
  VacationKind.Sick,
  VacationKind.PaidTimeOff,
];

interface NewRequestDialogProps {
  /** Controlled open state. When provided, the built-in trigger button is hidden. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** ISO (YYYY-MM-DD) day to preselect for From/To instead of today. */
  initialDate?: string;
}

export function NewRequestDialog({ open, onOpenChange, initialDate }: NewRequestDialogProps = {}) {
  const { t } = useTranslation();
  const groupsQuery = useGroups();
  const createVacation = useCreateVacation();

  const baseDate = initialDate ?? todayIso();
  const controlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const dialogOpen = controlled ? open : internalOpen;
  const setDialogOpen = (o: boolean) => {
    if (controlled) onOpenChange?.(o);
    else setInternalOpen(o);
  };

  const [groupId, setGroupId] = useState("");
  const [from, setFrom] = useState(baseDate);
  const [to, setTo] = useState(baseDate);
  const [vacationType, setVacationType] = useState<VacationKind>(VacationKind.Vacation);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [halfDay, setHalfDay] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const groups = groupsQuery.data ?? [];
  const hasGroups = groups.length > 0;

  // Default to the first available group until the user explicitly picks one, so the
  // dialog always opens with a valid selection (derived during render — no effect needed).
  const selectedGroupId = groupId || (groups[0]?.id ?? "");

  const isSingleDay = from === to;

  function resetForm() {
    setGroupId("");
    setFrom(baseDate);
    setTo(baseDate);
    setVacationType(VacationKind.Vacation);
    setStartTime("");
    setEndTime("");
    setHalfDay(false);
    setNote("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedGroupId || !from || !to) return;
    if (to < from) {
      setError(t.newRequest.endBeforeStart);
      return;
    }

    try {
      await createVacation.mutateAsync({
        groupId: selectedGroupId,
        from,
        to,
        vacationType,
        startTime: startTime || null,
        endTime: endTime || null,
        // The backend stamps halfDay onto every day it creates, so a range
        // would book a half day for each — only offer it on a single day.
        halfDay: isSingleDay && halfDay,
        note: note.trim() ? note.trim() : null,
      });
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const days = extractConflictingDays(err);
        if (days.length > 0) {
          const formatted = days.map((d) => formatIsoDay(d, t.common.dateLocale)).join(", ");
          setError(t.newRequest.conflict(formatted));
        } else {
          setError(err.message || t.newRequest.conflictGeneric);
        }
        return;
      }
      const msg = err instanceof Error ? err.message : t.newRequest.createFailed;
      setError(msg);
    }
  }

  const isValid = !!selectedGroupId && !!from && !!to && to >= from && !createVacation.isPending;

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(o) => {
        setDialogOpen(o);
        if (!o) resetForm();
      }}
    >
      {controlled ? null : (
        <DialogTrigger asChild>
          <Button size="sm" disabled={!hasGroups && !groupsQuery.isLoading}>
            {t.newRequest.trigger}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.newRequest.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error ? (
            <div
              role="alert"
              className="bg-destructive/10 text-destructive border-destructive/30 rounded-2xl border px-3 py-2 text-sm"
            >
              {error}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="group">{t.newRequest.group}</Label>
            <Select value={selectedGroupId} onValueChange={setGroupId}>
              <SelectTrigger id="group">
                <SelectValue
                  placeholder={
                    groupsQuery.isLoading
                      ? t.newRequest.loadingGroups
                      : hasGroups
                        ? t.newRequest.selectGroup
                        : t.newRequest.noGroups
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.groupName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="type">{t.newRequest.type}</Label>
            <Select value={vacationType} onValueChange={(v) => setVacationType(v as VacationKind)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REQUESTABLE_KINDS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {t.leaveTypes[k].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="from">{t.newRequest.from}</Label>
              <Input
                id="from"
                type="date"
                required
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  if (to < e.target.value) setTo(e.target.value);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to">{t.newRequest.to}</Label>
              <Input
                id="to"
                type="date"
                required
                min={from}
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start">{t.newRequest.startTime}</Label>
              <Input
                id="start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end">{t.newRequest.endTime}</Label>
              <Input
                id="end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {isSingleDay ? (
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-1">
                <Label htmlFor="halfDay">{t.newRequest.halfDay}</Label>
                <p className="text-muted-foreground text-sm">{t.newRequest.halfDayHint}</p>
              </div>
              <Switch id="halfDay" checked={halfDay} onCheckedChange={setHalfDay} />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="note">{t.newRequest.note}</Label>
            <Textarea
              id="note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.newRequest.notePlaceholder}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={!isValid}>
              {createVacation.isPending ? t.newRequest.submitting : t.newRequest.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
