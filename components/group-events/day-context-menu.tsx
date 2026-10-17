"use client";

import { useState, type ReactNode } from "react";
import { Cake, CalendarClock, CalendarPlus, Clock, Pencil, Trash2 } from "lucide-react";
import { DayItemRows } from "@/components/dashboard/day-items";
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
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import type { IsoDate } from "@/lib/api/types";
import type { DayItem } from "@/lib/calendar/day-items";
import { cardDate } from "@/lib/group-events/labels";
import { useTranslation } from "@/lib/i18n/use-translation";

type Point = { x: number; y: number };

/**
 * The day cell under a point. Bars and stripes are drawn over the cells, so the first element
 * there is often not a cell; every element stacked at the point is checked.
 */
function dateAt(point: Point): IsoDate | null {
  for (const el of document.elementsFromPoint(point.x, point.y)) {
    const date = el.closest("[data-date]")?.getAttribute("data-date");
    if (date) return date;
  }
  return null;
}

function GroupEventSub({ item, onOpen }: { item: DayItem; onOpen: () => void }) {
  const { t } = useTranslation();
  const labels = t.groupEvents.menu;
  const edit = item.actions?.find((a) => a.kind === "edit")?.onSelect;
  const remove = item.actions?.find((a) => a.kind === "delete")?.onSelect;
  return (
    <ContextMenuSub>
      <ContextMenuSubTrigger className="gap-2.5">
        <Clock />
        <span className="min-w-0 truncate">{item.title}</span>
      </ContextMenuSubTrigger>
      <ContextMenuSubContent className="max-w-64">
        <ContextMenuItem onSelect={onOpen}>{labels.open}</ContextMenuItem>
        <ContextMenuItem disabled={!edit} onSelect={edit}>
          <Pencil /> {labels.edit}
        </ContextMenuItem>
        <ContextMenuItem variant="destructive" disabled={!remove} onSelect={remove}>
          <Trash2 /> {labels.delete}
        </ContextMenuItem>
        {item.card?.locked ? <ContextMenuLabel>{item.card.locked}</ContextMenuLabel> : null}
      </ContextMenuSubContent>
    </ContextMenuSub>
  );
}

/**
 * One right-click menu around a whole calendar: request time off, a new group event, the day's
 * group events and its birthdays. Left clicks and drags pass through to the calendar untouched.
 */
export function DayContextMenu({
  dayItems,
  onRequestTimeOff,
  onNewGroupEvent,
  children,
}: {
  dayItems: ReadonlyMap<IsoDate, DayItem[]>;
  onRequestTimeOff: (date: IsoDate) => void;
  /** Leave it out where nobody may create a group event. */
  onNewGroupEvent?: (date: IsoDate) => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const labels = t.groupEvents.menu;
  const [date, setDate] = useState<IsoDate | null>(null);
  const [point, setPoint] = useState<Point>({ x: 0, y: 0 });
  const [opened, setOpened] = useState<{ item: DayItem; point: Point } | null>(null);
  const items = date ? (dayItems.get(date) ?? []) : [];
  const events = items.filter((i) => i.kind === "groupEvent");
  const birthdays = items.filter((i) => i.kind === "birthday");

  function locate(at: Point) {
    setPoint(at);
    setDate(dateAt(at));
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger
          asChild
          onContextMenu={(e) => locate({ x: e.clientX, y: e.clientY })}
          // A touch long-press opens the menu without a contextmenu event in some browsers.
          onPointerDown={(e) => {
            if (e.pointerType !== "mouse") locate({ x: e.clientX, y: e.clientY });
          }}
        >
          <div>{children}</div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-60" onCloseAutoFocus={(e) => e.preventDefault()}>
          {date ? (
            <>
              <ContextMenuLabel>{cardDate(date, t)}</ContextMenuLabel>
              <ContextMenuItem onSelect={() => onRequestTimeOff(date)}>
                <CalendarPlus /> {labels.requestTimeOff}
              </ContextMenuItem>
              {onNewGroupEvent ? (
                <ContextMenuItem onSelect={() => onNewGroupEvent(date)}>
                  <CalendarClock /> {labels.newGroupEvent}
                </ContextMenuItem>
              ) : null}
              {items.length > 0 ? <ContextMenuSeparator /> : null}
              {events.map((item) => (
                <GroupEventSub
                  key={item.key}
                  item={item}
                  onOpen={() => setOpened({ item, point })}
                />
              ))}
              {birthdays.map((item) => (
                <ContextMenuLabel key={item.key} className="flex items-center gap-2.5 text-sm">
                  <Cake className="size-4 shrink-0" /> {item.title}
                </ContextMenuLabel>
              ))}
            </>
          ) : (
            <ContextMenuLabel>{labels.pickDay}</ContextMenuLabel>
          )}
        </ContextMenuContent>
      </ContextMenu>
      <Popover open={opened !== null} onOpenChange={(open) => !open && setOpened(null)}>
        <PopoverAnchor asChild>
          <span
            aria-hidden
            className="pointer-events-none fixed size-px"
            style={{ left: opened?.point.x ?? 0, top: opened?.point.y ?? 0 }}
          />
        </PopoverAnchor>
        {/* Focus leaves the closing menu after this opens; only a click outside closes it. */}
        <PopoverContent
          align="start"
          className="w-80 p-2"
          onFocusOutside={(e) => e.preventDefault()}
        >
          {opened ? (
            <DayItemRows
              items={[opened.item]}
              onAction={() => setOpened(null)}
              label={opened.item.title}
            />
          ) : null}
        </PopoverContent>
      </Popover>
    </>
  );
}
