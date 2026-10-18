"use client";

import type { SyntheticEvent } from "react";
import Link from "next/link";
import { Cake, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { IsoDate } from "@/lib/api/types";
import { formatIsoDate } from "@/lib/calendar/month-grid";
import { countDayItems, type DayItem } from "@/lib/calendar/day-items";
import { useTranslation } from "@/lib/i18n/use-translation";
import { BIRTHDAY_TINT } from "@/lib/birthdays/birthday";

export const EVENT_INK = "var(--text)";

const CAKE_COLOR = `color-mix(in oklch, ${BIRTHDAY_TINT} 75%, var(--text))`;

// The popover portals out of the DOM but React still bubbles its events to the day cell, which
// would book the day or start a drag.
const stop = (e: SyntheticEvent) => e.stopPropagation();

function ItemTile({ kind }: { kind: DayItem["kind"] }) {
  if (kind === "birthday") {
    return (
      <span
        className="grid size-7 shrink-0 place-items-center rounded-lg"
        style={{
          background: `color-mix(in oklch, ${BIRTHDAY_TINT} 18%, var(--surface))`,
          color: `color-mix(in oklch, ${BIRTHDAY_TINT} 70%, var(--text))`,
        }}
      >
        <Cake className="size-4" />
      </span>
    );
  }
  return (
    <span
      className="grid size-7 shrink-0 place-items-center rounded-lg"
      style={{ background: "var(--surface-2)", color: EVENT_INK }}
    >
      <CalendarClock className="size-4" />
    </span>
  );
}

function ItemText({ item }: { item: DayItem }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="flex min-w-0 items-center gap-1.5 text-[13.5px] font-semibold">
        {item.time ? <span className="tnum shrink-0 opacity-75">{item.time}</span> : null}
        <span className="truncate">{item.title}</span>
      </span>
      {item.detail ? (
        <span
          className="block truncate text-[12px]"
          style={{ color: "var(--text-muted)" }}
          data-detail
        >
          {item.detail}
        </span>
      ) : null}
    </span>
  );
}

/** A day's group events and birthdays, one row each. */
export function DayItemRows({ items, label }: { items: readonly DayItem[]; label: string }) {
  return (
    <ul aria-label={label} className="grid gap-1">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-2">
          {item.href ? (
            <Link
              href={item.href}
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1.5 py-1 transition-colors hover:bg-[var(--surface-2)] [&_[data-detail]]:underline [&_[data-detail]]:underline-offset-2"
            >
              <ItemTile kind={item.kind} />
              <ItemText item={item} />
            </Link>
          ) : (
            <span className="flex min-w-0 flex-1 items-center gap-2.5 px-1.5 py-1">
              <ItemTile kind={item.kind} />
              <ItemText item={item} />
            </span>
          )}
          {item.actions?.map((action) => (
            <Button
              key={action.label}
              size="sm"
              variant={action.destructive ? "destructive" : "outline"}
              onClick={action.onSelect}
            >
              {action.label}
            </Button>
          ))}
        </li>
      ))}
    </ul>
  );
}

/**
 * The Lanes day chip: a cake for birthdays, a dot and the first group event's title with `+N` for
 * the rest. It sits in the day's header row and takes no lane; it opens the day's items.
 */
export function DayItemsChip({ date, items }: { date: IsoDate; items: readonly DayItem[] }) {
  const { t } = useTranslation();
  if (items.length === 0) return null;
  const { events, birthdays } = countDayItems(items);
  const firstEvent = items.find((i) => i.kind === "groupEvent");
  const dayLabel = formatIsoDate(date, t.common.dateLocale, { day: "numeric", month: "long" });

  return (
    <Popover>
      <PopoverTrigger
        onPointerDown={stop}
        onClick={stop}
        onKeyDown={stop}
        aria-label={t.calendar.dayItems.onDay(
          t.calendar.dayItems.summary(events, birthdays),
          dayLabel
        )}
        className="absolute top-[9px] right-1.5 flex h-[22px] max-w-[calc(100%-38px)] min-w-0 items-center gap-1 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-1.5 text-[11px] font-semibold transition-colors hover:bg-[var(--surface-2)] @max-[60px]:top-1 @max-[60px]:right-0.5 @max-[60px]:h-auto @max-[60px]:max-w-none @max-[60px]:border-0 @max-[60px]:bg-transparent @max-[60px]:px-0"
      >
        {birthdays > 0 ? (
          <Cake className="size-3.5 shrink-0" style={{ color: CAKE_COLOR }} />
        ) : null}
        {firstEvent ? (
          <>
            <span className="size-1.5 shrink-0 rounded-full" style={{ background: EVENT_INK }} />
            <span className="min-w-0 truncate @max-[60px]:hidden">{firstEvent.title}</span>
          </>
        ) : null}
        {events > 1 ? (
          <span className="shrink-0 @max-[60px]:hidden" style={{ color: "var(--text-muted)" }}>
            +{events - 1}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 gap-0 p-0"
        onPointerDown={stop}
        onClick={stop}
        onKeyDown={stop}
      >
        <p
          className="border-b px-3 py-2 text-[12px] font-semibold"
          style={{ color: "var(--text-faint)", borderColor: "var(--border)" }}
        >
          {dayLabel}
        </p>
        <div className="max-h-[60dvh] overflow-y-auto p-2">
          <DayItemRows items={items} label={dayLabel} />
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** The Stripes corner marks: a cake and up to three dots. Plain spans, as the cell is a button. */
export function DayItemMarks({ items }: { items: readonly DayItem[] }) {
  if (items.length === 0) return null;
  const hasBirthday = items.some((i) => i.kind === "birthday");
  const events = items.filter((i) => i.kind === "groupEvent").slice(0, 3);
  return (
    <span aria-hidden className="absolute top-2.5 right-1.5 flex items-center gap-[3px] sm:right-2">
      {hasBirthday ? (
        <Cake data-mark="birthday" className="size-3" style={{ color: CAKE_COLOR }} />
      ) : null}
      {events.map((item) => (
        <span
          key={item.key}
          data-mark="groupEvent"
          className="size-[6px] rounded-full"
          style={{ background: EVENT_INK }}
        />
      ))}
    </span>
  );
}
