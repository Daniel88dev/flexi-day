"use client";

import { Repeat } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RepeatRule } from "@/lib/api/group-events";
import type { IsoDate } from "@/lib/api/types";
import { formatIsoDate } from "@/lib/calendar/month-grid";
import { defaultRule, fitRule, nextDates } from "@/lib/group-events/draft";
import { cardDate, ruleSummary } from "@/lib/group-events/labels";
import { monthPosition, plusDays, weekdayOf } from "@/lib/group-events/occurrences";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

const FREQS = ["daily", "weekly", "monthly", "yearly"] as const;
const NEVER = "never";

function Chip({
  pressed,
  className,
  ...props
}: React.ComponentProps<"button"> & { pressed: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        "rounded-full px-3 py-[5px] text-[12.5px] font-semibold transition-colors disabled:cursor-default",
        pressed
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground ring-1 ring-[var(--border-strong)]",
        className
      )}
      {...props}
    />
  );
}

/**
 * The repeat controls of the group event sheet. `value` holds what the user picked; what shows is
 * that rule fitted to the start, so the start's weekday is always on.
 */
export function RepeatEditor({
  start,
  value,
  onChange,
  disabledReason,
  preview,
}: {
  start: IsoDate;
  value: RepeatRule | null;
  onChange: (rule: RepeatRule | null) => void;
  disabledReason?: string | null;
  /** The dates to preview when they differ from the rule's own, as for a "This event" edit. */
  preview?: readonly IsoDate[];
}) {
  const { t } = useTranslation();
  const labels = t.groupEvents.repeat;
  const rule = value ? fitRule(value, start) : null;
  const set = (patch: Partial<RepeatRule>) => value && onChange({ ...value, ...patch });
  const startWeekday = weekdayOf(start);
  const startDay = Number(start.slice(8, 10));
  const { nth, isLast } = monthPosition(start);
  const weekdayName = formatIsoDate(start, t.common.dateLocale, { weekday: "long" });

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="ge-repeat">{labels.label}</Label>
        <Select
          value={rule?.freq ?? NEVER}
          disabled={Boolean(disabledReason)}
          onValueChange={(v) =>
            onChange(v === NEVER ? null : defaultRule(v as RepeatRule["freq"], start))
          }
        >
          <SelectTrigger id="ge-repeat" className="w-full" aria-label={labels.label}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NEVER}>{labels.never}</SelectItem>
            {FREQS.map((freq) => (
              <SelectItem key={freq} value={freq}>
                {labels[freq]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {disabledReason ? (
          <p className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>
            {disabledReason}
          </p>
        ) : null}
      </div>

      {rule && !disabledReason ? (
        <div
          className="space-y-3 rounded-2xl border p-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          <div className="flex items-center gap-2 text-sm">
            <span>{labels.every}</span>
            <Input
              type="number"
              min={1}
              max={99}
              value={rule.interval}
              onChange={(e) =>
                set({ interval: Math.max(1, Math.min(99, Number(e.target.value) || 1)) })
              }
              className="h-8 w-16"
              aria-label={labels.interval}
            />
            <span>{labels.unit(rule.freq, rule.interval)}</span>
          </div>

          {rule.freq === "weekly" ? (
            <div className="space-y-1.5">
              <span className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>
                {labels.on}
              </span>
              <div className="flex flex-wrap gap-1">
                {t.calendar.weekdaysShort.map((name, day) => {
                  const on = rule.weekdays.includes(day);
                  const locked = day === startWeekday;
                  return (
                    <Chip
                      key={name}
                      pressed={on}
                      disabled={locked}
                      title={locked ? labels.startWeekday : undefined}
                      className="h-8 min-w-10 px-2"
                      onClick={() =>
                        set({
                          weekdays: on
                            ? rule.weekdays.filter((d) => d !== day)
                            : [...rule.weekdays, day].sort((a, b) => a - b),
                        })
                      }
                    >
                      {name}
                    </Chip>
                  );
                })}
              </div>
            </div>
          ) : null}

          {rule.freq === "monthly" ? (
            <div className="flex flex-wrap gap-1.5">
              <Chip
                pressed={rule.monthlyMode === "day"}
                onClick={() => set({ monthlyMode: "day" })}
              >
                {labels.onDay(startDay)}
              </Chip>
              {nth <= 4 ? (
                <Chip
                  pressed={rule.monthlyMode === "weekday"}
                  onClick={() => set({ monthlyMode: "weekday" })}
                >
                  {labels.onNthWeekday(nth, weekdayName)}
                </Chip>
              ) : null}
              {isLast ? (
                <Chip
                  pressed={rule.monthlyMode === "lastWeekday"}
                  onClick={() => set({ monthlyMode: "lastWeekday" })}
                >
                  {labels.onLastWeekday(weekdayName)}
                </Chip>
              ) : null}
              {startDay > 28 && rule.monthlyMode === "day" ? (
                <p className="w-full text-[12px]" style={{ color: "var(--text-muted)" }}>
                  {labels.shorterMonths}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>{labels.endsLabel}</span>
            <Chip pressed={rule.until === null} onClick={() => set({ until: null })}>
              {labels.endsNever}
            </Chip>
            <Chip
              pressed={rule.until !== null}
              onClick={() => rule.until === null && set({ until: plusDays(start, 91) })}
            >
              {labels.endsOnDate}
            </Chip>
            {rule.until !== null ? (
              <Input
                type="date"
                min={start}
                value={rule.until}
                onChange={(e) => e.target.value && set({ until: e.target.value })}
                className="h-8 w-40"
                aria-label={labels.lastDate}
              />
            ) : null}
          </div>

          <p
            className="flex items-center gap-1.5 text-[12.5px] font-semibold"
            style={{ color: "var(--text-muted)" }}
          >
            <Repeat aria-hidden className="size-3.5 shrink-0" />
            {ruleSummary(start, rule, t)}
          </p>

          <NextDates dates={preview ?? nextDates(start, rule)} />
        </div>
      ) : null}
    </div>
  );
}

function NextDates({ dates }: { dates: readonly IsoDate[] }) {
  const { t } = useTranslation();
  const label = t.groupEvents.repeat.nextDates;
  return (
    <div className="space-y-1">
      <span className="text-[12px]" style={{ color: "var(--text-faint)" }}>
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1">
        <ul aria-label={label} className="contents">
          {dates.map((date) => (
            <li
              key={date}
              className="tnum rounded-full border px-2 py-[2px] text-[11.5px] font-semibold"
              style={{ borderColor: "var(--border-strong)", background: "var(--surface)" }}
            >
              {cardDate(date, t)}
            </li>
          ))}
        </ul>
        {dates.length === 6 ? (
          <span aria-hidden className="px-1 text-[11.5px]" style={{ color: "var(--text-faint)" }}>
            …
          </span>
        ) : null}
      </div>
    </div>
  );
}
