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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { CalendarRecordTypePicker } from "@/components/calendar-record-type-picker";
import { useGroup, useUpdateVacation } from "@/lib/api/queries";
import {
  CalendarRecordType,
  sickDayBenefitActive,
  type UpdateVacationInput,
  type VacationDetail,
} from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";

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
  // Only for the benefit gate on the type picker; undefined while loading
  // means SickDay is not offered rather than flashing in.
  const groupDetail = useGroup(open ? detail.groupId : null);

  // Null while the Others group is open with no type picked yet.
  const [vacationType, setVacationType] = useState<CalendarRecordType | null>(detail.vacationType);
  const [startTime, setStartTime] = useState(toInputTime(detail.startTime));
  const [endTime, setEndTime] = useState(toInputTime(detail.endTime));
  const [halfDay, setHalfDay] = useState(detail.halfDay);
  const [note, setNote] = useState(detail.note ?? "");
  const [error, setError] = useState<string | null>(null);

  const isSingleDay = detail.rangeStart === detail.rangeEnd;

  const noteRequired = vacationType === CalendarRecordType.Other;
  const canSave =
    vacationType !== null && (!noteRequired || note.trim().length > 0) && !updateVacation.isPending;

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

    if (vacationType === null) return;

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
            <Label id="edit-type-label" htmlFor="edit-type-top">
              {t.newRequest.type}
            </Label>
            <CalendarRecordTypePicker
              value={vacationType}
              onChange={setVacationType}
              idPrefix="edit-type"
              extraKind={detail.vacationType}
              offerSickDay={sickDayBenefitActive(groupDetail.data)}
            />
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
            <div className="flex items-start gap-3">
              <Checkbox
                id="edit-halfDay"
                className="mt-0.5"
                checked={halfDay}
                onCheckedChange={(v) => setHalfDay(v === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="edit-halfDay">{t.newRequest.halfDay}</Label>
                <p className="text-muted-foreground text-sm">{t.newRequest.halfDayHint}</p>
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="edit-note">
              {noteRequired ? t.newRequest.noteRequiredForOther : t.newRequest.note}
            </Label>
            <Textarea
              id="edit-note"
              rows={2}
              required={noteRequired}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.newRequest.notePlaceholder}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => close(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={!canSave}>
              {updateVacation.isPending ? t.editRequest.saving : t.editRequest.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
