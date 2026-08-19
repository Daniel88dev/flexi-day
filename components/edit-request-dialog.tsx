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
import { useUpdateVacation } from "@/lib/api/queries";
import { VacationKind, type UpdateVacationInput, type VacationDetail } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";

const REQUESTABLE_KINDS: VacationKind[] = [
  VacationKind.Vacation,
  VacationKind.HomeOffice,
  VacationKind.Sick,
  VacationKind.PaidTimeOff,
];

/** Backend times are HH:MM:SS; `<input type="time">` wants HH:MM. */
function toInputTime(value: string | null): string {
  return value ? value.slice(0, 5) : "";
}

function formatDay(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short" });
}

function formatDayRange(startIso: string, endIso: string, locale: string) {
  const start = formatDay(startIso, locale);
  return startIso === endIso ? start : `${start} – ${formatDay(endIso, locale)}`;
}

/**
 * Admin-only in-place edit of a request's per-day fields. Dates are not
 * editable here — moving a record to another day is cancel + re-create, so the
 * whole contiguous run (`detail.vacationIds`) is always edited together.
 */
export function EditRequestDialog({
  detail,
  open,
  onOpenChange,
}: {
  detail: VacationDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const updateVacation = useUpdateVacation();

  const [vacationType, setVacationType] = useState<VacationKind>(detail.vacationType);
  const [startTime, setStartTime] = useState(toInputTime(detail.startTime));
  const [endTime, setEndTime] = useState(toInputTime(detail.endTime));
  const [halfDay, setHalfDay] = useState(detail.halfDay);
  const [note, setNote] = useState(detail.note ?? "");
  const [error, setError] = useState<string | null>(null);

  const isSingleDay = detail.rangeStart === detail.rangeEnd;

  function close(nextOpen: boolean) {
    if (!nextOpen) {
      setVacationType(detail.vacationType);
      setStartTime(toInputTime(detail.startTime));
      setEndTime(toInputTime(detail.endTime));
      setHalfDay(detail.halfDay);
      setNote(detail.note ?? "");
      setError(null);
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const patch: Omit<UpdateVacationInput, "ids"> = {};
    if (vacationType !== detail.vacationType) patch.vacationType = vacationType;
    // When either time moves, send both: the backend's ordering check then sees
    // the whole pair instead of validating one side against a stored value.
    if (startTime !== toInputTime(detail.startTime) || endTime !== toInputTime(detail.endTime)) {
      patch.startTime = startTime || null;
      patch.endTime = endTime || null;
    }
    if (isSingleDay && halfDay !== detail.halfDay) patch.halfDay = halfDay;
    const trimmedNote = note.trim() ? note.trim() : null;
    if (trimmedNote !== detail.note) patch.note = trimmedNote;

    if (Object.keys(patch).length === 0) {
      close(false);
      return;
    }

    try {
      await updateVacation.mutateAsync({ ids: detail.vacationIds, ...patch });
      close(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.editRequest.updateFailed);
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.editRequest.title}</DialogTitle>
          {/* Names the full span so it is visible that every day of the run
              gets the same values. */}
          <DialogDescription>
            {detail.user.name} · {detail.groupName} ·{" "}
            {formatDayRange(detail.rangeStart, detail.rangeEnd, t.common.dateLocale)}
          </DialogDescription>
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
            <Label htmlFor="edit-type">{t.newRequest.type}</Label>
            <Select value={vacationType} onValueChange={(v) => setVacationType(v as VacationKind)}>
              <SelectTrigger id="edit-type">
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
              <Label htmlFor="edit-start">{t.newRequest.startTime}</Label>
              <Input
                id="edit-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-end">{t.newRequest.endTime}</Label>
              <Input
                id="edit-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {isSingleDay ? (
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-1">
                <Label htmlFor="edit-halfDay">{t.newRequest.halfDay}</Label>
                <p className="text-muted-foreground text-sm">{t.newRequest.halfDayHint}</p>
              </div>
              <Switch id="edit-halfDay" checked={halfDay} onCheckedChange={setHalfDay} />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="edit-note">{t.newRequest.note}</Label>
            <Textarea
              id="edit-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.newRequest.notePlaceholder}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => close(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={updateVacation.isPending}>
              {updateVacation.isPending ? t.editRequest.saving : t.editRequest.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
