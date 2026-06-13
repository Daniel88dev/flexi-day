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
import { useCreateVacation, useGroups } from "@/lib/api/queries";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function NewRequestDialog() {
  const groupsQuery = useGroups();
  const createVacation = useCreateVacation();

  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [requestedDay, setRequestedDay] = useState(todayIso());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState<string | null>(null);

  const groups = groupsQuery.data ?? [];
  const hasGroups = groups.length > 0;

  function resetForm() {
    setGroupId("");
    setRequestedDay(todayIso());
    setStartTime("");
    setEndTime("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!groupId || !requestedDay) return;

    try {
      await createVacation.mutateAsync({
        groupId,
        requestedDay,
        startTime: startTime || null,
        endTime: endTime || null,
      });
      setOpen(false);
      resetForm();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not create vacation";
      setError(
        msg.toLowerCase().includes("failed to create vacation")
          ? "You already have a request for that day."
          : msg
      );
    }
  }

  const isValid = !!groupId && !!requestedDay && !createVacation.isPending;

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
          <DialogTitle>New Vacation Request</DialogTitle>
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
            <Label htmlFor="day">Date</Label>
            <Input
              id="day"
              type="date"
              required
              value={requestedDay}
              onChange={(e) => setRequestedDay(e.target.value)}
            />
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

          <p className="text-muted-foreground text-xs">
            Submitted as <span className="font-medium">Vacation</span>. Other leave types coming
            soon.
          </p>

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
