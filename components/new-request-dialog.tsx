"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { CalendarRecordTypePicker } from "@/components/calendar-record-type-picker";
import { AttachmentList } from "@/components/attachments/attachment-list";
import { AttachmentUploader } from "@/components/attachments/attachment-uploader";
import { AttachmentsHeading } from "@/components/attachments/attachments-heading";
import {
  useCreateVacation,
  useGroup,
  useGroups,
  useGroupUsers,
  useVacation,
} from "@/lib/api/queries";
import { ApiError } from "@/lib/api/client";
import { planLimitFromError } from "@/lib/billing/plan-limit-error";
import { CalendarRecordType, sickDayBenefitActive, type UserSummary } from "@/lib/api/types";
import {
  MAX_ATTACHMENTS_PER_REQUEST,
  attachmentDisplayStatus,
  hasProcessingAttachment,
  isFailedUpload,
} from "@/lib/attachments/rules";
import { useAttachmentUploads } from "@/lib/attachments/use-attachment-uploads";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/** The window the backend accepts: this calendar year through the end of the next. */
function bookableWindow(): { min: string; max: string } {
  const year = new Date().getFullYear();
  return { min: `${year}-01-01`, max: `${year + 1}-12-31` };
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

/** Radix Select items cannot carry an empty value, so "myself" needs a sentinel. */
const SELF = "__self__";

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
  // Null while the Others group is open with no type picked yet.
  const [vacationType, setVacationType] = useState<CalendarRecordType | null>(
    CalendarRecordType.Vacation
  );
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [halfDay, setHalfDay] = useState(false);
  const [note, setNote] = useState("");
  const [forUserId, setForUserId] = useState(SELF);
  const [autoApprove, setAutoApprove] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Set once the backend has the request; from then on the dialog only
  // follows the files chosen for it.
  const [created, setCreated] = useState<{ requestId: string; vacationId: string } | null>(null);

  const groups = groupsQuery.data ?? [];
  const hasGroups = groups.length > 0;

  // Default to the first available group until the user explicitly picks one, so the
  // dialog always opens with a valid selection (derived during render — no effect needed).
  const selectedGroupId = groupId || (groups[0]?.id ?? "");

  // Admin standing (incl. via org admin) gates the on-behalf picker; the
  // backend enforces the same rule, this only decides whether to offer it.
  const { data: session } = useSession();
  const groupDetail = useGroup(dialogOpen ? selectedGroupId || null : null);
  const canAdmin = groupDetail.data?.access.canAdmin ?? false;
  const membersQuery = useGroupUsers(dialogOpen && canAdmin ? selectedGroupId || null : null);
  // Wait for the session before listing anyone: with the caller's id unknown,
  // the self-exclusion cannot work and an admin could pick themselves.
  const members = session
    ? (membersQuery.data ?? []).filter(
        (m) => m.controlledUser && !m.deletedAt && m.userId !== session.user.id
      )
    : [];

  const onBehalf = canAdmin && forUserId !== SELF;

  const offerSickDay = sickDayBenefitActive(groupDetail.data);
  // Derived, not reset in an effect: a Sick day selection must not survive a
  // switch to a group without the benefit — the picker would no longer offer
  // it and the backend would 422 the submit.
  const effectiveType =
    vacationType === CalendarRecordType.SickDay && !offerSickDay
      ? CalendarRecordType.Vacation
      : vacationType;

  const isSingleDay = from === to;

  const createdQuery = useVacation(created?.vacationId ?? null);
  const uploaded = (createdQuery.data?.attachments ?? []).filter((a) => a.deletedAt === null);
  const uploads = useAttachmentUploads({
    requestId: created?.requestId ?? null,
    attachments: createdQuery.data?.attachments ?? [],
  });
  const offerAttachments = groupDetail.data?.uploadsAvailable === true;
  const stillChecking = uploaded.filter((a) => !isFailedUpload(a, uploads.failedIds));
  const uploadsSettling =
    uploads.queued > 0 || uploads.inFlight > 0 || hasProcessingAttachment(stillChecking);
  const uploadsClean =
    uploads.failed === 0 &&
    stillChecking.length === uploaded.length &&
    uploaded.every((a) => attachmentDisplayStatus(a) === "ready");
  const uploadsDone = created !== null && !uploadsSettling;
  const people = [createdQuery.data?.user, createdQuery.data?.createdByUser].filter(
    (p): p is UserSummary => p !== null && p !== undefined
  );

  function resetForm() {
    setGroupId("");
    setFrom(baseDate);
    setTo(baseDate);
    setVacationType(CalendarRecordType.Vacation);
    setStartTime("");
    setEndTime("");
    setHalfDay(false);
    setNote("");
    setForUserId(SELF);
    setAutoApprove(true);
    setError(null);
    setCreated(null);
    uploads.reset();
  }

  function closeAndReset() {
    setDialogOpen(false);
    resetForm();
  }

  const finish = useEffectEvent(closeAndReset);
  // Every file accepted: the dialog's work is over. A rejection keeps it open
  // so the reason is read first. The verdict comes from the polled detail, so
  // reacting here is the subscription the lint asks for.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (uploadsDone && uploadsClean) finish();
  }, [uploadsDone, uploadsClean]);

  const bookable = bookableWindow();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedGroupId || !from || !to || effectiveType === null) return;
    if (to < from) {
      setError(t.newRequest.endBeforeStart);
      return;
    }

    try {
      const rows = await createVacation.mutateAsync({
        groupId: selectedGroupId,
        ...(onBehalf ? { userId: forUserId, autoApprove } : {}),
        from,
        to,
        vacationType: effectiveType,
        startTime: startTime || null,
        endTime: endTime || null,
        // The backend stamps halfDay onto every day it creates, so a range
        // would book a half day for each — only offer it on a single day.
        halfDay: isSingleDay && halfDay,
        note: note.trim() ? note.trim() : null,
      });
      const first = rows[0];
      const sent = first ? uploads.start(first.requestId) : 0;
      if (!first || sent === 0) {
        closeAndReset();
        return;
      }
      setCreated({ requestId: first.requestId, vacationId: first.id });
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
      // A lapsed plan makes over-limit groups read-only. This is the one place
      // an ordinary member meets that state, so it needs a translated reason
      // rather than the backend's raw English.
      const planLimit = planLimitFromError(err);
      if (planLimit) {
        setError(
          planLimit.reason === "READ_ONLY"
            ? t.billing.readOnlyGroup
            : t.billing.memberLimitReached(planLimit.limit)
        );
        return;
      }
      const msg = err instanceof Error ? err.message : t.newRequest.createFailed;
      setError(msg);
    }
  }

  const noteRequired = effectiveType === CalendarRecordType.Other;
  const isValid =
    !!selectedGroupId &&
    !!from &&
    !!to &&
    to >= from &&
    effectiveType !== null &&
    (!noteRequired || note.trim().length > 0) &&
    !createVacation.isPending;

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
        {created ? (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full",
                  uploadsDone && !uploadsClean
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
                )}
              >
                {uploadsDone ? (
                  uploadsClean ? (
                    <Check className="size-4" />
                  ) : (
                    <AlertCircle className="size-4" />
                  )
                ) : (
                  <Loader2 className="size-4 animate-spin" />
                )}
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{t.newRequest.submitted}</p>
                <p role="status" className="text-muted-foreground text-sm">
                  {uploadsDone
                    ? uploadsClean
                      ? t.newRequest.uploadsAccepted
                      : t.newRequest.uploadProblems
                    : t.newRequest.uploadingFiles}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <AttachmentsHeading
                used={MAX_ATTACHMENTS_PER_REQUEST - uploads.remaining}
                max={MAX_ATTACHMENTS_PER_REQUEST}
              />
              {uploads.settled.length > 0 ? (
                <AttachmentList
                  attachments={uploads.settled}
                  people={people}
                  failedIds={uploads.failedIds}
                />
              ) : null}
              <AttachmentUploader uploads={uploads} notice={false} />
            </div>
            <DialogFooter>
              <Button type="button" onClick={closeAndReset}>
                {t.common.done}
              </Button>
            </DialogFooter>
          </div>
        ) : (
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
              <Select
                value={selectedGroupId}
                onValueChange={(v) => {
                  setGroupId(v);
                  // The picked member belongs to the previous group.
                  setForUserId(SELF);
                  setAutoApprove(true);
                  // So do the picked files: the new group may not take uploads.
                  uploads.reset();
                  // So does a Sick day selection — the new group's benefit is
                  // unknown until its badge loads, and the coerced "Vacation"
                  // must not silently revert if the benefit turns out active.
                  if (vacationType === CalendarRecordType.SickDay) {
                    setVacationType(CalendarRecordType.Vacation);
                  }
                }}
              >
                <SelectTrigger id="group" className="w-full">
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

            {canAdmin ? (
              <div className="space-y-1.5">
                <Label htmlFor="forMember">{t.newRequest.forMember}</Label>
                <Select
                  value={forUserId}
                  onValueChange={(v) => {
                    setForUserId(v);
                    if (v === SELF) setAutoApprove(true);
                  }}
                >
                  <SelectTrigger id="forMember" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SELF}>{t.newRequest.myself}</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {m.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {onBehalf ? (
              <div className="flex items-start gap-3">
                <Checkbox
                  id="autoApprove"
                  className="mt-0.5"
                  checked={autoApprove}
                  onCheckedChange={(v) => setAutoApprove(v === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="autoApprove">{t.newRequest.approveImmediately}</Label>
                  <p className="text-muted-foreground text-sm">
                    {t.newRequest.approveImmediatelyHint}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label id="type-label" htmlFor="type-top">
                {t.newRequest.type}
              </Label>
              <CalendarRecordTypePicker
                value={effectiveType}
                onChange={setVacationType}
                idPrefix="type"
                offerSickDay={offerSickDay}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="from">{t.newRequest.from}</Label>
                <Input
                  id="from"
                  type="date"
                  required
                  min={bookable.min}
                  max={bookable.max}
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
                  min={from || bookable.min}
                  max={bookable.max}
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
              <div className="flex items-start gap-3">
                <Checkbox
                  id="halfDay"
                  className="mt-0.5"
                  checked={halfDay}
                  onCheckedChange={(v) => setHalfDay(v === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="halfDay">{t.newRequest.halfDay}</Label>
                  <p className="text-muted-foreground text-sm">{t.newRequest.halfDayHint}</p>
                </div>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="note">
                {noteRequired ? t.newRequest.noteRequiredForOther : t.newRequest.note}
              </Label>
              <Textarea
                id="note"
                rows={2}
                required={noteRequired}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.newRequest.notePlaceholder}
              />
            </div>

            {offerAttachments ? (
              <div className="space-y-1.5">
                <AttachmentsHeading
                  used={MAX_ATTACHMENTS_PER_REQUEST - uploads.remaining}
                  max={MAX_ATTACHMENTS_PER_REQUEST}
                />
                <AttachmentUploader uploads={uploads} />
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeAndReset}>
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={!isValid}>
                {createVacation.isPending ? t.newRequest.submitting : t.newRequest.submit}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
