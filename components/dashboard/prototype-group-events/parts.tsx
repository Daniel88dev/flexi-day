"use client";

// PROTOTYPE (T-340): pieces every variant shares. Throwaway, never merged.

import { useState, type ReactNode } from "react";
import {
  CalendarClock,
  CalendarPlus,
  Cake,
  Clock,
  Pencil,
  Repeat,
  Trash2,
  Users,
} from "lucide-react";
import { AvatarBubble } from "@/components/brand/avatar-bubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { IsoDate } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import {
  WEEKDAYS_LONG,
  WEEKDAYS_SHORT,
  dayMonth,
  expand,
  nthOf,
  parse,
  ruleSummary,
  shortDate,
  timeLabel,
  weekdayOf,
  type BirthdayOnDay,
  type EditScope,
  type EventPatch,
  type Freq,
  type GroupEvent,
  type Occurrence,
  type RepeatRule,
} from "./model";

export const EVENT_INK = "var(--text)";
export const BIRTHDAY_TINT = "oklch(0.7 0.14 340)";

// ---------- repeat ----------

const FREQ_UNIT: Record<Freq, string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  yearly: "year",
};

function defaultRule(freq: Freq, start: IsoDate): RepeatRule {
  return {
    freq,
    interval: 1,
    weekdays: [weekdayOf(start)],
    monthlyMode: "day",
    until: null,
  };
}

const ORD = ["", "1st", "2nd", "3rd", "4th"];

export function RepeatEditor({
  start,
  value,
  onChange,
  disabledReason,
  showPreview,
}: {
  start: IsoDate;
  value: RepeatRule | null;
  onChange: (rule: RepeatRule | null) => void;
  disabledReason?: string | null;
  showPreview?: boolean;
}) {
  const startWd = weekdayOf(start);
  const { nth, isLast } = nthOf(start);
  const set = (patch: Partial<RepeatRule>) => value && onChange({ ...value, ...patch });

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="ge-repeat">Repeat</Label>
        <Select
          value={value?.freq ?? "none"}
          disabled={Boolean(disabledReason)}
          onValueChange={(v) => onChange(v === "none" ? null : defaultRule(v as Freq, start))}
        >
          <SelectTrigger id="ge-repeat" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Does not repeat</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
        {disabledReason ? (
          <p className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>
            {disabledReason}
          </p>
        ) : null}
      </div>

      {value && !disabledReason ? (
        <div
          className="space-y-3 rounded-2xl border p-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          <div className="flex items-center gap-2 text-sm">
            <span>Every</span>
            <Input
              type="number"
              min={1}
              max={99}
              value={value.interval}
              onChange={(e) =>
                set({ interval: Math.max(1, Math.min(99, Number(e.target.value) || 1)) })
              }
              className="h-8 w-16"
              aria-label="Interval"
            />
            <span>
              {FREQ_UNIT[value.freq]}
              {value.interval === 1 ? "" : "s"}
            </span>
          </div>

          {value.freq === "weekly" ? (
            <div className="space-y-1.5">
              <span className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>
                On
              </span>
              <div className="flex gap-1">
                {WEEKDAYS_SHORT.map((w, i) => {
                  const on = value.weekdays.includes(i);
                  const locked = i === startWd;
                  return (
                    <button
                      key={w}
                      type="button"
                      aria-pressed={on}
                      disabled={locked}
                      title={locked ? "The start date's weekday always repeats" : undefined}
                      onClick={() =>
                        set({
                          weekdays: on
                            ? value.weekdays.filter((d) => d !== i)
                            : [...value.weekdays, i].sort(),
                        })
                      }
                      className={cn(
                        "grid h-8 w-9 place-items-center rounded-full text-[12px] font-semibold transition-colors",
                        on
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground ring-1 ring-[var(--border-strong)]",
                        locked && "opacity-80"
                      )}
                    >
                      {w.slice(0, 2)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {value.freq === "monthly" ? (
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["day", `On day ${parse(start).getUTCDate()}`],
                  nth <= 4 ? ["weekday", `On the ${ORD[nth]} ${WEEKDAYS_LONG[startWd]}`] : null,
                  isLast ? ["lastWeekday", `On the last ${WEEKDAYS_LONG[startWd]}`] : null,
                ].filter(Boolean) as [RepeatRule["monthlyMode"], string][]
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={value.monthlyMode === mode}
                  onClick={() => set({ monthlyMode: mode })}
                  className={cn(
                    "rounded-full px-3 py-[5px] text-[12.5px] font-semibold transition-colors",
                    value.monthlyMode === mode
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground ring-1 ring-[var(--border-strong)]"
                  )}
                >
                  {label}
                </button>
              ))}
              {parse(start).getUTCDate() > 28 && value.monthlyMode === "day" ? (
                <p className="w-full text-[12px]" style={{ color: "var(--text-muted)" }}>
                  Shorter months use their last day.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>Ends</span>
            <button
              type="button"
              aria-pressed={value.until === null}
              onClick={() => set({ until: null })}
              className={cn(
                "rounded-full px-3 py-[5px] text-[12.5px] font-semibold",
                value.until === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground ring-1 ring-[var(--border-strong)]"
              )}
            >
              Never
            </button>
            <button
              type="button"
              aria-pressed={value.until !== null}
              onClick={() => value.until === null && set({ until: plusMonths(start, 3) })}
              className={cn(
                "rounded-full px-3 py-[5px] text-[12.5px] font-semibold",
                value.until !== null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground ring-1 ring-[var(--border-strong)]"
              )}
            >
              On a date
            </button>
            {value.until !== null ? (
              <Input
                type="date"
                min={start}
                value={value.until}
                onChange={(e) => set({ until: e.target.value || null })}
                className="h-8 w-40"
                aria-label="Last date"
              />
            ) : null}
          </div>

          <p className="text-[12.5px] font-semibold" style={{ color: "var(--text-muted)" }}>
            <Repeat className="mr-1 inline size-3.5" />
            {ruleSummary(start, value)}
          </p>

          {showPreview ? <NextOccurrences start={start} rule={value} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function plusMonths(d: IsoDate, n: number): IsoDate {
  const x = parse(d);
  x.setUTCMonth(x.getUTCMonth() + n);
  return x.toISOString().slice(0, 10);
}

function NextOccurrences({ start, rule }: { start: IsoDate; rule: RepeatRule }) {
  const probe: GroupEvent = {
    id: "probe",
    groupName: "",
    title: "",
    start,
    end: start,
    allDay: true,
    repeat: rule,
    skipped: [],
    createdBy: { name: "", initials: "", avatarColor: "" },
  };
  const next = expand([probe], start, plusMonths(start, 36)).slice(0, 6);
  return (
    <div className="space-y-1">
      <span className="text-[12px]" style={{ color: "var(--text-faint)" }}>
        Next dates
      </span>
      <div className="flex flex-wrap gap-1">
        {next.map((o) => (
          <span
            key={o.key}
            className="tnum rounded-full border px-2 py-[2px] text-[11.5px] font-semibold"
            style={{ borderColor: "var(--border-strong)", background: "var(--surface)" }}
          >
            {shortDate(o.from)}
          </span>
        ))}
        {next.length === 6 ? (
          <span className="px-1 text-[11.5px]" style={{ color: "var(--text-faint)" }}>
            …
          </span>
        ) : null}
      </div>
    </div>
  );
}

// ---------- form ----------

export interface FormDraft extends EventPatch {
  groupName: string;
}

export function blankDraft(date: IsoDate, endDate: IsoDate | null, groupName: string): FormDraft {
  return {
    groupName,
    title: "",
    note: "",
    start: date,
    end: endDate ?? date,
    allDay: true,
    startTime: "09:00",
    endTime: "10:00",
    repeat: null,
  };
}

export function draftFrom(e: GroupEvent, occurrenceDate: IsoDate): FormDraft {
  const span = Math.round((parse(e.end).getTime() - parse(e.start).getTime()) / 86400000);
  const start = e.repeat ? e.start : occurrenceDate;
  const end = parse(start);
  end.setUTCDate(end.getUTCDate() + span);
  return {
    groupName: e.groupName,
    title: e.title,
    note: e.note ?? "",
    start,
    end: end.toISOString().slice(0, 10),
    allDay: e.allDay,
    startTime: e.startTime ?? "09:00",
    endTime: e.endTime ?? "10:00",
    repeat: e.repeat,
  };
}

export function draftProblem(d: FormDraft): string | null {
  if (!d.title.trim()) return "Give the event a title.";
  if (d.end < d.start) return "The end date is before the start.";
  if (!d.allDay && d.start === d.end && (d.endTime ?? "") <= (d.startTime ?? ""))
    return "It ends before it starts.";
  return null;
}

export function EventFields({
  draft,
  onChange,
  groups,
  lockRepeat,
  showPreview,
  compact,
}: {
  draft: FormDraft;
  onChange: (d: FormDraft) => void;
  groups: string[];
  /** "This event" edits keep the occurrence a single day with no repeat rule. */
  lockRepeat?: boolean;
  showPreview?: boolean;
  compact?: boolean;
}) {
  const set = (patch: Partial<FormDraft>) => {
    const next = { ...draft, ...patch };
    if (next.end < next.start) next.end = next.start;
    if (next.start !== next.end) next.repeat = null;
    if (next.repeat?.freq === "weekly" && !next.repeat.weekdays.includes(weekdayOf(next.start)))
      next.repeat = { ...next.repeat, weekdays: [...next.repeat.weekdays, weekdayOf(next.start)] };
    onChange(next);
  };
  const multiDay = draft.start !== draft.end;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="ge-title">Title</Label>
        <Input
          id="ge-title"
          autoFocus
          value={draft.title}
          onChange={(e) => set({ title: e.target.value })}
          maxLength={120}
        />
      </div>

      {groups.length > 1 ? (
        <div className="space-y-1.5">
          <Label htmlFor="ge-group">Group</Label>
          <Select value={draft.groupName} onValueChange={(v) => set({ groupName: v })}>
            <SelectTrigger id="ge-group" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ge-start">{multiDay ? "From" : "Date"}</Label>
          <Input
            id="ge-start"
            type="date"
            value={draft.start}
            onChange={(e) => e.target.value && set({ start: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ge-end">Until</Label>
          <Input
            id="ge-end"
            type="date"
            min={draft.start}
            disabled={lockRepeat}
            value={draft.end}
            onChange={(e) => e.target.value && set({ end: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="ge-allday" className="font-normal">
          All day
        </Label>
        <Switch
          id="ge-allday"
          checked={draft.allDay}
          onCheckedChange={(allDay) => set({ allDay })}
        />
      </div>

      {!draft.allDay ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ge-from">Starts{multiDay ? ` ${dayMonth(draft.start)}` : ""}</Label>
            <Input
              id="ge-from"
              type="time"
              value={draft.startTime}
              onChange={(e) => set({ startTime: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ge-to">Ends{multiDay ? ` ${dayMonth(draft.end)}` : ""}</Label>
            <Input
              id="ge-to"
              type="time"
              value={draft.endTime}
              onChange={(e) => set({ endTime: e.target.value })}
            />
          </div>
        </div>
      ) : null}

      <RepeatEditor
        start={draft.start}
        value={draft.repeat}
        onChange={(repeat) => set({ repeat })}
        showPreview={showPreview}
        disabledReason={
          lockRepeat
            ? "You're changing one date, so the repeat rule stays as it is."
            : multiDay
              ? "Only single-day events can repeat."
              : null
        }
      />

      {!compact ? (
        <div className="space-y-1.5">
          <Label htmlFor="ge-note">Note</Label>
          <Textarea
            id="ge-note"
            rows={2}
            value={draft.note}
            onChange={(e) => set({ note: e.target.value })}
            placeholder="Optional"
          />
        </div>
      ) : null}
    </div>
  );
}

// ---------- reading ----------

export function canEdit(e: GroupEvent, role: Role): boolean {
  return role === "admin" || Boolean(e.createdBy.isYou);
}

export type Role = "admin" | "member";

export function EventCard({
  occ,
  role,
  showGroup,
  onEdit,
  onDelete,
}: {
  occ: Occurrence;
  role: Role;
  showGroup: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const e = occ.event;
  const editable = canEdit(e, role);
  return (
    <div className="space-y-2.5">
      <div className="flex items-start gap-2.5">
        <span
          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg"
          style={{ background: EVENT_INK, color: "var(--surface)" }}
        >
          <CalendarClock className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-tight font-semibold">{e.title}</p>
          <p className="mt-0.5 text-[12.5px]" style={{ color: "var(--text-muted)" }}>
            {shortDate(occ.from)}
            {occ.to !== occ.from ? ` – ${shortDate(occ.to)}` : ""} ·{" "}
            {e.allDay ? "All day" : `${e.startTime} – ${e.endTime}`}
          </p>
        </div>
      </div>
      {e.repeat ? (
        <p
          className="flex items-center gap-1.5 text-[12.5px]"
          style={{ color: "var(--text-muted)" }}
        >
          <Repeat className="size-3.5" />
          {ruleSummary(e.start, e.repeat)}
        </p>
      ) : null}
      {e.parentId ? (
        <p className="text-[12px]" style={{ color: "var(--text-faint)" }}>
          Changed for this date only
        </p>
      ) : null}
      {e.note ? <p className="text-[13px] leading-snug">{e.note}</p> : null}
      <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-muted)" }}>
        <AvatarBubble
          initials={e.createdBy.initials}
          background={e.createdBy.avatarColor}
          name={e.createdBy.name}
          size={18}
        />
        <span className="min-w-0 truncate">
          Added by {e.createdBy.isYou ? "you" : e.createdBy.name}
          {showGroup ? (
            <>
              {" "}
              · <Users className="inline size-3" /> {e.groupName}
            </>
          ) : null}
        </span>
      </div>
      {editable ? (
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="size-3.5" /> Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive">
            <Trash2 className="size-3.5" /> Delete
          </Button>
        </div>
      ) : (
        <p className="pt-1 text-[12px]" style={{ color: "var(--text-faint)" }}>
          Only {e.createdBy.name.split(" ")[0]} or a group admin can change this.
        </p>
      )}
    </div>
  );
}

export function birthdayText(b: BirthdayOnDay): string {
  if (b.birthday.person.isYou) return b.age ? `Your birthday · ${b.age}` : "Your birthday";
  const first = b.birthday.person.name.split(" ")[0];
  return b.age ? `${first} turns ${b.age}` : `${first}'s birthday`;
}

export function BirthdayRow({ b, showGroup }: { b: BirthdayOnDay; showGroup?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="grid size-7 shrink-0 place-items-center rounded-lg"
        style={{
          background: `color-mix(in oklch, ${BIRTHDAY_TINT} 18%, var(--surface))`,
          color: `color-mix(in oklch, ${BIRTHDAY_TINT} 70%, var(--text))`,
        }}
      >
        <Cake className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold">{birthdayText(b)}</p>
        <p className="truncate text-[12px]" style={{ color: "var(--text-muted)" }}>
          {b.birthday.person.isYou ? (
            <a href="/settings" className="underline underline-offset-2">
              Change in Settings
            </a>
          ) : (
            <>
              {b.birthday.person.name}
              {showGroup ? ` · ${b.birthday.groupName}` : ""}
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export function EventLine({ occ, showGroup }: { occ: Occurrence; showGroup?: boolean }) {
  const e = occ.event;
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {e.allDay ? null : (
        <span className="tnum shrink-0 font-semibold opacity-75">{e.startTime}</span>
      )}
      <span className="truncate">{e.title}</span>
      {e.repeat ? <Repeat className="size-3 shrink-0 opacity-60" /> : null}
      {showGroup ? (
        <span className="shrink-0 text-[10.5px] opacity-60">· {e.groupName}</span>
      ) : null}
    </span>
  );
}

export { timeLabel };

// ---------- scope + delete ----------

export function ScopeDialog({
  open,
  action,
  occ,
  changes,
  ruleChanged,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  action: "edit" | "delete";
  occ: Occurrence | null;
  changes: number;
  /** Ask-on-save flow: a changed rule can't apply to one date only. */
  ruleChanged?: boolean;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (scope: EditScope) => void;
}) {
  const [scope, setScope] = useState<EditScope>("this");
  if (!occ) return null;
  const e = occ.event;
  const recurring = Boolean(e.repeat);
  const options: [EditScope, string, string | null][] = recurring
    ? [
        ["this", "This event", `Only ${shortDate(occ.from)}`],
        ["following", "This and following", `${shortDate(occ.from)} onwards`],
        ["all", "All events", "Every date, past ones included"],
      ]
    : [];
  const effective = ruleChanged && scope === "this" ? "following" : scope;
  const warnAll =
    recurring && effective === "all" && changes > 0 && (action === "delete" || ruleChanged);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {action === "delete" ? `Delete “${e.title}”?` : `Change “${e.title}”`}
          </DialogTitle>
          <DialogDescription>
            {action === "delete"
              ? "It disappears from every calendar, the ICS feed and synced Google or Microsoft calendars. This can't be undone."
              : "Which dates should the change apply to?"}
          </DialogDescription>
        </DialogHeader>
        {recurring ? (
          <div role="radiogroup" className="grid gap-1.5">
            {options.map(([value, label, sub]) => {
              const disabled = ruleChanged && value === "this";
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={effective === value}
                  disabled={disabled}
                  onClick={() => setScope(value)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors disabled:opacity-45",
                    effective === value ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <span
                    className={cn(
                      "mt-1 size-3.5 shrink-0 rounded-full border-2",
                      effective === value ? "border-primary bg-primary" : "border-border"
                    )}
                  />
                  <span>
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="block text-[12.5px]" style={{ color: "var(--text-muted)" }}>
                      {disabled ? "A new repeat rule can't apply to one date" : sub}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
        {warnAll ? (
          <p
            className="rounded-xl px-3 py-2 text-[12.5px]"
            style={{ background: "var(--warm-soft)", color: "var(--text)" }}
          >
            {action === "delete"
              ? `Also removes ${changes} one-off change${changes === 1 ? "" : "s"} made to single dates.`
              : `${changes} one-off change${changes === 1 ? "" : "s"} to single dates will be lost, deleted dates included.`}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={action === "delete" ? "destructive" : "default"}
            onClick={() => onConfirm(effective)}
          >
            {confirmLabel ?? (action === "delete" ? "Delete" : "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- context menu ----------

export interface DayMenuApi {
  occurrencesOn: (date: IsoDate) => Occurrence[];
  birthdaysOn: (date: IsoDate) => BirthdayOnDay[];
  role: Role;
  canCreate: boolean;
  onRequestTimeOff: (date: IsoDate) => void;
  onNewEvent: (date: IsoDate, point: { x: number; y: number }) => void;
  onOpenEvent: (occ: Occurrence, point: { x: number; y: number }) => void;
  onEdit: (occ: Occurrence) => void;
  onDelete: (occ: Occurrence) => void;
}

/**
 * One menu for the whole grid. The date comes from whatever day cell sits under the pointer,
 * so bars and stripes drawn over the cells still resolve to their day.
 */
export function DayContextMenu({ api, children }: { api: DayMenuApi; children: ReactNode }) {
  const [date, setDate] = useState<IsoDate | null>(null);
  const [point, setPoint] = useState({ x: 0, y: 0 });
  const occs = date ? api.occurrencesOn(date) : [];
  const bdays = date ? api.birthdaysOn(date) : [];

  return (
    <ContextMenu>
      <ContextMenuTrigger
        asChild
        onContextMenu={(e) => {
          const hit = document
            .elementsFromPoint(e.clientX, e.clientY)
            .map((el) => el.closest("[data-drag-date]")?.getAttribute("data-drag-date"))
            .find(Boolean);
          setDate(hit ?? null);
          setPoint({ x: e.clientX, y: e.clientY });
        }}
      >
        <div>{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-60" onCloseAutoFocus={(e) => e.preventDefault()}>
        {date ? (
          <>
            <ContextMenuLabel>{shortDate(date)}</ContextMenuLabel>
            <ContextMenuItem onSelect={() => api.onRequestTimeOff(date)}>
              <CalendarPlus /> Request time off
            </ContextMenuItem>
            {api.canCreate ? (
              <ContextMenuItem onSelect={() => api.onNewEvent(date, point)}>
                <CalendarClock /> New group event
              </ContextMenuItem>
            ) : null}
            {occs.length > 0 || bdays.length > 0 ? <ContextMenuSeparator /> : null}
            {occs.map((occ) => {
              const editable = canEdit(occ.event, api.role);
              return (
                <ContextMenuSub key={occ.key}>
                  <ContextMenuSubTrigger>
                    <Clock />
                    <span className="min-w-0 truncate">{occ.event.title}</span>
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    <ContextMenuItem onSelect={() => api.onOpenEvent(occ, point)}>
                      Open
                    </ContextMenuItem>
                    <ContextMenuItem disabled={!editable} onSelect={() => api.onEdit(occ)}>
                      <Pencil /> Edit…
                    </ContextMenuItem>
                    <ContextMenuItem
                      variant="destructive"
                      disabled={!editable}
                      onSelect={() => api.onDelete(occ)}
                    >
                      <Trash2 /> Delete…
                    </ContextMenuItem>
                    {!editable ? (
                      <ContextMenuLabel className="max-w-48">
                        Only the creator or a group admin
                      </ContextMenuLabel>
                    ) : null}
                  </ContextMenuSubContent>
                </ContextMenuSub>
              );
            })}
            {bdays.map((b) => (
              <ContextMenuLabel key={b.key} className="flex items-center gap-2.5 text-sm">
                <Cake className="size-4" /> {birthdayText(b)}
              </ContextMenuLabel>
            ))}
          </>
        ) : (
          <ContextMenuLabel>Right-click a day</ContextMenuLabel>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
