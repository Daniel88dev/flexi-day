import type { GroupEventRow } from "@/lib/api/group-events";
import type { IsoDate } from "@/lib/api/types";
import type { DayItem, DayItemAction } from "@/lib/calendar/day-items";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { ruleSummary, whenLabel } from "./labels";
import { occurrences, plusDays, type Occurrence } from "./occurrences";
import { firstName } from "@/lib/birthdays/birthday";

/** Which group event a card's action is about, and which of its dates the viewer picked it on. */
export interface GroupEventTarget {
  event: GroupEventRow;
  /** The occurrence's first day; for a one-off, its start date. */
  occurrenceDate: IsoDate;
}

export interface GroupEventHandlers {
  onEdit?: (target: GroupEventTarget) => void;
  onDelete?: (target: GroupEventTarget) => void;
}

export interface GroupEventDayItemsContext {
  viewerId: string | null;
  /** Mine scope mixes several groups, so each card names its own. */
  showGroup: boolean;
  t: Dictionary;
  handlers?: GroupEventHandlers;
}

interface Placed {
  item: DayItem;
  startsToday: boolean;
  startTime: string | null;
}

function actionsFor(
  target: GroupEventTarget,
  t: Dictionary,
  handlers: GroupEventHandlers | undefined
): DayItemAction[] {
  const { onEdit, onDelete } = handlers ?? {};
  return [
    { kind: "edit", label: t.calendar.groupEvent.edit, onSelect: onEdit && (() => onEdit(target)) },
    {
      kind: "delete",
      label: t.calendar.groupEvent.delete,
      destructive: true,
      onSelect: onDelete && (() => onDelete(target)),
    },
  ];
}

function itemsFor(
  event: GroupEventRow,
  occurrence: Occurrence,
  window: { from: IsoDate; to: IsoDate },
  ctx: GroupEventDayItemsContext
): Placed[] {
  const labels = ctx.t.calendar.groupEvent;
  const target = { event, occurrenceDate: occurrence.startDate };
  const creator = event.createdBy;
  const card = {
    when: whenLabel(occurrence, event, ctx.t),
    repeat: event.repeat ? ruleSummary(event.startDate, event.repeat, ctx.t) : undefined,
    changedOnce: event.recurringEventId ? labels.changedOnce : undefined,
    note: event.note ?? undefined,
    addedBy: !creator
      ? labels.addedByFormerMember
      : creator.id === ctx.viewerId
        ? labels.addedByYou
        : labels.addedBy(creator.name),
    creator: creator ?? undefined,
    group: ctx.showGroup ? event.groupName : undefined,
    locked: event.canEdit
      ? undefined
      : creator
        ? labels.lockedTo(firstName(creator.name))
        : labels.lockedToAdmins,
  };
  const actions = event.canEdit ? actionsFor(target, ctx.t, ctx.handlers) : undefined;
  const spansDays = occurrence.startDate !== occurrence.endDate;

  const placed: Placed[] = [];
  const first = occurrence.startDate > window.from ? occurrence.startDate : window.from;
  const last = occurrence.endDate < window.to ? occurrence.endDate : window.to;
  for (let date = first; date <= last; date = plusDays(date, 1)) {
    placed.push({
      item: {
        key: `ge:${event.id}:${occurrence.startDate}:${date}`,
        kind: "groupEvent",
        date,
        title: event.title,
        card,
        actions,
        spansDays,
      },
      startsToday: date === occurrence.startDate,
      startTime: event.startTime,
    });
  }
  return placed;
}

/**
 * The group events' occurrences in the window as day items, one per day each covers. On a day,
 * the events that start there come before those running on from earlier, then all-day ones
 * before timed ones by start time.
 */
export function groupEventDayItems(
  rows: readonly GroupEventRow[],
  window: { from: IsoDate; to: IsoDate },
  ctx: GroupEventDayItemsContext
): DayItem[] {
  const placed = rows.flatMap((event) =>
    occurrences(event, window.from, window.to).flatMap((occurrence) =>
      itemsFor(event, occurrence, window, ctx)
    )
  );
  return placed
    .sort(
      (a, b) =>
        a.item.date.localeCompare(b.item.date) ||
        Number(b.startsToday) - Number(a.startsToday) ||
        (a.startTime ?? "").localeCompare(b.startTime ?? "") ||
        a.item.title.localeCompare(b.item.title)
    )
    .map((p) => p.item);
}
