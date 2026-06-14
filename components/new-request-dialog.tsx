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
import { Textarea } from "@/components/ui/textarea";
import { useCreateVacation, useGroups } from "@/lib/api/queries";
import { ApiError } from "@/lib/api/client";
import { VACATION_KIND_LABELS, VacationKind } from "@/lib/api/types";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatIsoDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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

export function NewRequestDialog() {
  const groupsQuery = useGroups();
  const createVacation = useCreateVacation();

  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState(todayIso());
  const [vacationType, setVacationType] = useState<VacationKind>(VacationKind.Vacation);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const groups = groupsQuery.data ?? [];
  const hasGroups = groups.length > 0;

  function resetForm() {
    setGroupId("");
    setFrom(todayIso());
    setTo(todayIso());
    setVacationType(VacationKind.Vacation);
    setStartTime("");
    setEndTime("");
    setNote("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!groupId || !from || !to) return;
    if (to < from) {
      setError("End date must be on or after start date.");
      return;
    }

    try {
      await createVacation.mutateAsync({
        groupId,
        from,
        to,
        vacationType,
        startTime: startTime || null,
        endTime: endTime || null,
        note: note.trim() ? note.trim() : null,
      });
      setOpen(false);
      resetForm();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const days = extractConflictingDays(err);
        if (days.length > 0) {
          const formatted = days.map(formatIsoDay).join(", ");
          setError(
            `Some days in that range are already booked: ${formatted}. Please pick different dates.`
          );
        } else {
          setError(
            err.message ||
              "Some days in that range are already booked. Please pick different dates."
          );
        }
        return;
      }
      const msg = err instanceof Error ? err.message : "Could not create vacation";
      setError(msg);
    }
  }

  const isValid = !!groupId && !!from && !!to && to >= from && !createVacation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" disabled={!hasGroups && !groupsQuery.isLoading}>
          + New Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Request</DialogTitle>
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
            <Label htmlFor="group">Group</Label>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger id="group">
                <SelectValue
                  placeholder={
                    groupsQuery.isLoading
                      ? "Loading groups…"
                      : hasGroups
                        ? "Select group…"
                        : "No groups available"
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
            <Label htmlFor="type">Type</Label>
            <Select value={vacationType} onValueChange={(v) => setVacationType(v as VacationKind)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REQUESTABLE_KINDS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {VACATION_KIND_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="from">From</Label>
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
              <Label htmlFor="to">To</Label>
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
              <Label htmlFor="start">Start time (optional)</Label>
              <Input
                id="start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end">End time (optional)</Label>
              <Input
                id="end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Family trip, conference, …"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              {createVacation.isPending ? "Submitting…" : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
