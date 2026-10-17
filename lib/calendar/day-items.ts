import type { IsoDate } from "@/lib/api/types";

/** What sits on a calendar day besides bookings. Neither kind takes a lane. */
export type DayItemKind = "groupEvent" | "birthday";

export interface DayItemAction {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
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
