import type { IsoDate, UserSummary } from "@/lib/api/types";

/** What sits on a calendar day besides bookings. Neither kind takes a lane. */
export type DayItemKind = "groupEvent" | "birthday";

export interface DayItemAction {
  label: string;
  /** Without a handler the button shows, disabled. */
  onSelect?: () => void;
  destructive?: boolean;
}

/** A group event's card in the day's list, every line already labelled. */
export interface DayItemCard {
  /** Dates and times, e.g. "Wed 21 Oct – Fri 23 Oct · All day". */
  when: string;
  repeat?: string;
  changedOnce?: string;
  note?: string;
  addedBy: string;
  /** The creator, for the avatar; absent once their account is gone. */
  creator?: UserSummary;
  /** The group's name, shown in Mine scope where several groups mix. */
  group?: string;
  /** Replaces the actions for a viewer who may not change it. */
  locked?: string;
}

/** One row in a day's chip popover and in the Stripes day list, already labelled. */
export interface DayItem {
  key: string;
  kind: DayItemKind;
  /** The day it shows on. */
  date: IsoDate;
  title: string;
  /** The second line: a full name, a group, a hint. */
  detail?: string;
  /** A timed group event's times; absent means all day. */
  time?: string;
  /** Turns the whole row into a link. */
  href?: string;
  actions?: DayItemAction[];
  /** Renders the item as a card rather than a single row. */
  card?: DayItemCard;
  /** Part of a group event that covers more than one day: Lanes draws a ribbon on the day. */
  spansDays?: boolean;
}

const KIND_ORDER: Record<DayItemKind, number> = { groupEvent: 0, birthday: 1 };

/** A day's items, group events first, each kind in the order given. */
export function dayItemsByDate(items: readonly DayItem[]): Map<IsoDate, DayItem[]> {
  const byDate = new Map<IsoDate, DayItem[]>();
  const sorted = [...items].sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
  for (const item of sorted) {
    const day = byDate.get(item.date);
    if (day) day.push(item);
    else byDate.set(item.date, [item]);
  }
  return byDate;
}

export function countDayItems(items: readonly DayItem[]): { events: number; birthdays: number } {
  let events = 0;
  let birthdays = 0;
  for (const item of items) {
    if (item.kind === "groupEvent") events++;
    else birthdays++;
  }
  return { events, birthdays };
}
