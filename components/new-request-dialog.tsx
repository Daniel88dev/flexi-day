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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TEAM_MEMBERS, LEAVE_TYPE_LABELS, LeaveType, LeaveRequest } from "@/lib/data";
import { useStore } from "@/lib/store";

export function NewRequestDialog() {
  const { addRequest } = useStore();
  const [open, setOpen] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [type, setType] = useState<LeaveType | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId || !type || !startDate || !endDate) return;

    const req: LeaveRequest = {
      id: `r${Date.now()}`,
      memberId,
      type: type as LeaveType,
      startDate,
      endDate,
      notes: notes.trim() || undefined,
      status: "pending",
      submittedAt: new Date().toISOString().slice(0, 10),
    };

    addRequest(req);
    setOpen(false);
    resetForm();
  }

  function resetForm() {
    setMemberId("");
    setType("");
    setStartDate("");
    setEndDate("");
    setNotes("");
  }

  const isValid = memberId && type && startDate && endDate && endDate >= startDate;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ New Request</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Leave Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="member">Team Member</Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger id="member">
                <SelectValue placeholder="Select member…" />
              </SelectTrigger>
              <SelectContent>
                {TEAM_MEMBERS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="type">Leave Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as LeaveType)}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type…" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(LEAVE_TYPE_LABELS) as [LeaveType, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start">Start Date</Label>
              <Input
                id="start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end">End Date</Label>
              <Input
                id="end"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional context…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
