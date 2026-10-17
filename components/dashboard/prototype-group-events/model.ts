// PROTOTYPE (T-340): in-memory group events and birthdays. Throwaway, never merged.

import type { IsoDate } from "@/lib/api/types";

export type Freq = "daily" | "weekly" | "monthly" | "yearly";

export interface RepeatRule {
  freq: Freq;
  interval: number;
  /** 0 = Monday … 6 = Sunday. Weekly only; always contains the start date's weekday. */
  weekdays: number[];
  /** Monthly only: "on day 17", "on the 3rd Tuesday" or "on the last Tuesday", read off the start date. */
  monthlyMode: "day" | "weekday" | "lastWeekday";
  /** Inclusive; null repeats forever. */
  until: IsoDate | null;
}

export interface Person {
  name: string;
  initials: string;
  avatarColor: string;
  isYou?: boolean;
}

export interface GroupEvent {
  id: string;
  groupName: string;
  title: string;
  note?: string;
  start: IsoDate;
  end: IsoDate;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
  repeat: RepeatRule | null;
  skipped: IsoDate[];
  /** A "this event" edit: a one-off that remembers its recurring group event. */
  parentId?: string;
  createdBy: Person;
}

export interface Birthday {
  id: string;
  person: Person;
  groupName: string;
  month: number;
  day: number;
  year?: number;
}

export interface Occurrence {
  key: string;
  event: GroupEvent;
  from: IsoDate;
  to: IsoDate;
}

export interface BirthdayOnDay {
  key: string;
  birthday: Birthday;
  date: IsoDate;
  age: number | null;
}

// ---------- dates ----------

export function parse(d: IsoDate): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

export function iso(d: Date): IsoDate {
  return d.toISOString().slice(0, 10);
}

export function plusDays(d: IsoDate, n: number): IsoDate {
  const x = parse(d);
  x.setUTCDate(x.getUTCDate() + n);
  return iso(x);
}

export function weekdayOf(d: IsoDate): number {
  return (parse(d).getUTCDay() + 6) % 7;
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function ymd(y: number, m: number, d: number): IsoDate {
  return iso(new Date(Date.UTC(y, m - 1, d)));
}

function clampDay(y: number, m: number, d: number): IsoDate {
  return ymd(y, m, Math.min(d, daysInMonth(y, m)));
}

/** 1–4 for "the nth weekday", -1 for "the last". */
export function nthOf(d: IsoDate): { nth: number; isLast: boolean } {
  const day = parse(d).getUTCDate();
  const [y, m] = d.split("-").map(Number);
  const nth = Math.ceil(day / 7);
  return { nth, isLast: day + 7 > daysInMonth(y, m) };
}

function nthWeekday(y: number, m: number, weekday: number, nth: number): IsoDate {
  if (nth === -1) {
    const last = ymd(y, m, daysInMonth(y, m));
    const back = (weekdayOf(last) - weekday + 7) % 7;
    return plusDays(last, -back);
  }
  const first = ymd(y, m, 1);
  const fwd = (weekday - weekdayOf(first) + 7) % 7;
  return plusDays(first, fwd + (nth - 1) * 7);
}

export const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAYS_LONG = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const ORD = ["", "1st", "2nd", "3rd", "4th"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function shortDate(d: IsoDate): string {
  const x = parse(d);
  return `${WEEKDAYS_SHORT[weekdayOf(d)]} ${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]}`;
}

export function dayMonth(d: IsoDate): string {
  const x = parse(d);
  return `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]}`;
}

// ---------- rules ----------

/** A 5th weekday only offers "last". */
export function monthlyWeekdayNth(start: IsoDate, mode: RepeatRule["monthlyMode"]): number {
  const { nth } = nthOf(start);
  return mode === "lastWeekday" || nth === 5 ? -1 : nth;
}

export function ruleSummary(start: IsoDate, rule: RepeatRule | null): string {
  if (!rule) return "Does not repeat";
  const every = (unit: string) =>
    rule.interval === 1 ? `Every ${unit}` : `Every ${rule.interval} ${unit}s`;
  let text: string;
  switch (rule.freq) {
    case "daily":
      text = rule.interval === 1 ? "Every day" : every("day");
      break;
    case "weekly": {
      const days = [...rule.weekdays].sort();
      const weekdaysOnly = days.join() === "0,1,2,3,4";
      text =
        weekdaysOnly && rule.interval === 1
          ? "Every weekday"
          : `${every("week")} on ${days.map((d) => WEEKDAYS_SHORT[d]).join(", ")}`;
      break;
    }
    case "monthly": {
      if (rule.monthlyMode === "day") {
        text = `${every("month")} on day ${parse(start).getUTCDate()}`;
      } else {
        const n = monthlyWeekdayNth(start, rule.monthlyMode);
        text = `${every("month")} on the ${n === -1 ? "last" : ORD[n]} ${WEEKDAYS_LONG[weekdayOf(start)]}`;
      }
      break;
    }
    case "yearly":
      text = `${every("year")} on ${dayMonth(start)}`;
      break;
  }
  return rule.until ? `${text}, until ${dayMonth(rule.until)} ${rule.until.slice(0, 4)}` : text;
}

export function timeLabel(e: GroupEvent): string {
  if (e.allDay) return e.start === e.end ? "All day" : `${dayMonth(e.start)} – ${dayMonth(e.end)}`;
  if (e.start === e.end) return `${e.startTime} – ${e.endTime}`;
  return `${dayMonth(e.start)} ${e.startTime} – ${dayMonth(e.end)} ${e.endTime}`;
}

function occurrenceDates(e: GroupEvent, from: IsoDate, to: IsoDate): IsoDate[] {
  const rule = e.repeat;
  if (!rule) return e.end >= from && e.start <= to ? [e.start] : [];
  const out: IsoDate[] = [];
  const last = rule.until && rule.until < to ? rule.until : to;
  const push = (d: IsoDate) => {
    if (d >= e.start && d >= from && d <= last && !e.skipped.includes(d)) out.push(d);
  };
  const [sy, sm, sd] = e.start.split("-").map(Number);
  switch (rule.freq) {
    case "daily":
      for (let d = e.start; d <= last; d = plusDays(d, rule.interval)) push(d);
      break;
    case "weekly": {
      const monday = plusDays(e.start, -weekdayOf(e.start));
      for (let w = monday; w <= last; w = plusDays(w, 7 * rule.interval))
        for (const wd of rule.weekdays) push(plusDays(w, wd));
      break;
    }
    case "monthly": {
      const nth = monthlyWeekdayNth(e.start, rule.monthlyMode);
      for (let k = 0; ; k += rule.interval) {
        const m0 = sm - 1 + k;
        const y = sy + Math.floor(m0 / 12);
        const m = (m0 % 12) + 1;
        if (ymd(y, m, 1) > last) break;
        push(
          rule.monthlyMode === "day"
            ? clampDay(y, m, sd)
            : nthWeekday(y, m, weekdayOf(e.start), nth)
        );
      }
      break;
    }
    case "yearly":
      for (let y = sy; ymd(y, 1, 1) <= last; y += rule.interval) push(clampDay(y, sm, sd));
      break;
  }
  return out.sort();
}

export function expand(events: GroupEvent[], from: IsoDate, to: IsoDate): Occurrence[] {
  return events.flatMap((e) => {
    const span = Math.round((parse(e.end).getTime() - parse(e.start).getTime()) / 86400000);
    return occurrenceDates(e, plusDays(from, -span), to).map((d) => ({
      key: `${e.id}|${d}`,
      event: e,
      from: d,
      to: plusDays(d, span),
    }));
  });
}

export function birthdaysIn(list: Birthday[], from: IsoDate, to: IsoDate): BirthdayOnDay[] {
  const out: BirthdayOnDay[] = [];
  for (let y = Number(from.slice(0, 4)); y <= Number(to.slice(0, 4)); y++) {
    for (const b of list) {
      const date = clampDay(y, b.month, b.day);
      if (date < from || date > to) continue;
      out.push({ key: `${b.id}|${y}`, birthday: b, date, age: b.year ? y - b.year : null });
    }
  }
  return out;
}

// ---------- edits ----------

export type EditScope = "this" | "following" | "all";

export type EventPatch = Omit<
  GroupEvent,
  "id" | "groupName" | "skipped" | "createdBy" | "parentId"
>;

export function oneOffChanges(events: GroupEvent[], id: string): number {
  const e = events.find((x) => x.id === id);
  return (e?.skipped.length ?? 0) + events.filter((x) => x.parentId === id).length;
}

let seq = 100;
const newId = () => `ev-${++seq}`;

export function createEvent(
  events: GroupEvent[],
  patch: EventPatch,
  groupName: string,
  you: Person
): GroupEvent[] {
  return [...events, { ...patch, id: newId(), groupName, skipped: [], createdBy: you }];
}

export function updateEvent(
  events: GroupEvent[],
  id: string,
  date: IsoDate,
  scope: EditScope,
  patch: EventPatch
): GroupEvent[] {
  const e = events.find((x) => x.id === id);
  if (!e) return events;
  if (!e.repeat || scope === "all") {
    const ruleChanged =
      JSON.stringify(e.repeat) !== JSON.stringify(patch.repeat) || e.start !== patch.start;
    return events.flatMap((x) => {
      if (x.id === id) return [{ ...x, ...patch, skipped: ruleChanged ? [] : x.skipped }];
      if (x.parentId === id) {
        if (ruleChanged) return [];
        return [
          {
            ...x,
            title: patch.title,
            note: patch.note,
            allDay: patch.allDay,
            startTime: patch.startTime,
            endTime: patch.endTime,
          },
        ];
      }
      return [x];
    });
  }
  if (scope === "this") {
    return [
      ...events.map((x) => (x.id === id ? { ...x, skipped: [...x.skipped, date] } : x)),
      {
        ...e,
        ...patch,
        end: patch.start,
        repeat: null,
        id: newId(),
        skipped: [],
        parentId: id,
      },
    ];
  }
  if (date === e.start) return updateEvent(events, id, date, "all", patch);
  return [
    ...events.map((x) =>
      x.id === id ? { ...x, repeat: { ...(x.repeat as RepeatRule), until: plusDays(date, -1) } } : x
    ),
    {
      ...e,
      ...patch,
      id: newId(),
      skipped: e.skipped.filter((d) => d >= date),
    },
  ];
}

export function deleteEvent(
  events: GroupEvent[],
  id: string,
  date: IsoDate,
  scope: EditScope
): GroupEvent[] {
  const e = events.find((x) => x.id === id);
  if (!e) return events;
  if (!e.repeat || scope === "all" || (scope === "following" && date === e.start))
    return events.filter((x) => x.id !== id && x.parentId !== id);
  if (scope === "this")
    return events.map((x) => (x.id === id ? { ...x, skipped: [...x.skipped, date] } : x));
  return events.map((x) =>
    x.id === id ? { ...x, repeat: { ...(x.repeat as RepeatRule), until: plusDays(date, -1) } } : x
  );
}

// ---------- fixtures ----------

export const YOU: Person = { name: "You", initials: "ME", avatarColor: "#7c6cf0", isYou: true };
const PETRA: Person = { name: "Petra Nováková", initials: "PN", avatarColor: "#e8956b" };
const JAN: Person = { name: "Jan Dvořák", initials: "JD", avatarColor: "#5fb39a" };
const OLA: Person = { name: "Ola Berg", initials: "OB", avatarColor: "#6a9be0" };
const TOMAS: Person = { name: "Tomáš Kral", initials: "TK", avatarColor: "#c97bb8" };

/** Fixtures land around the current month so the dashboard opens on them. */
export function fixtures(
  today: IsoDate,
  homeGroup: string,
  otherGroup: string,
  dense: boolean
): { events: GroupEvent[]; birthdays: Birthday[] } {
  const [y, m] = today.split("-").map(Number);
  const d = (day: number, dm = 0) =>
    clampDay(y + Math.floor((m - 1 + dm) / 12), ((m - 1 + dm + 12) % 12) + 1, day);
  const firstThu = nthWeekday(y, m, 3, 1);
  const lastFriPrev = nthWeekday(m === 1 ? y - 1 : y, m === 1 ? 12 : m - 1, 4, -1);
  const none = (r: Partial<RepeatRule> & Pick<RepeatRule, "freq">): RepeatRule => ({
    interval: 1,
    weekdays: [],
    monthlyMode: "day",
    until: null,
    ...r,
  });

  const events: GroupEvent[] = [
    {
      id: "ev-1",
      groupName: homeGroup,
      title: "Sprint review",
      note: "Demo what shipped. Bring screenshots.",
      start: firstThu,
      end: firstThu,
      allDay: false,
      startTime: "14:00",
      endTime: "15:00",
      repeat: none({ freq: "weekly", interval: 2, weekdays: [3] }),
      skipped: [],
      createdBy: PETRA,
    },
    {
      id: "ev-2",
      groupName: homeGroup,
      title: "Team offsite",
      note: "Lipno lake house. Bus leaves 8:00 from the office.",
      start: d(21),
      end: d(23),
      allDay: true,
      repeat: null,
      skipped: [],
      createdBy: YOU,
    },
    {
      id: "ev-3",
      groupName: homeGroup,
      title: "Quarterly planning",
      start: d(6),
      end: d(6),
      allDay: false,
      startTime: "09:30",
      endTime: "12:00",
      repeat: null,
      skipped: [],
      createdBy: JAN,
    },
    {
      id: "ev-4",
      groupName: homeGroup,
      title: "Pizza Friday",
      start: lastFriPrev,
      end: lastFriPrev,
      allDay: true,
      repeat: none({ freq: "monthly", monthlyMode: "lastWeekday" }),
      skipped: [],
      createdBy: YOU,
    },
    {
      id: "ev-5",
      groupName: otherGroup,
      title: "Support rota handover",
      start: d(27),
      end: d(28),
      allDay: false,
      startTime: "09:00",
      endTime: "17:00",
      repeat: null,
      skipped: [],
      createdBy: OLA,
    },
  ];
  if (dense) {
    events.push({
      id: "ev-6",
      groupName: homeGroup,
      title: "Morning standup",
      start: d(1, -1),
      end: d(1, -1),
      allDay: false,
      startTime: "09:15",
      endTime: "09:30",
      repeat: none({ freq: "weekly", weekdays: [0, 1, 2, 3, 4] }),
      skipped: [],
      createdBy: JAN,
    });
  }

  const birthdays: Birthday[] = [
    { id: "bd-1", person: PETRA, groupName: homeGroup, month: m, day: 9, year: 1992 },
    { id: "bd-2", person: TOMAS, groupName: homeGroup, month: m, day: 22 },
    { id: "bd-3", person: YOU, groupName: homeGroup, month: m, day: 30, year: 1988 },
    { id: "bd-4", person: OLA, groupName: otherGroup, month: m, day: 14, year: 1997 },
  ];
  return { events, birthdays };
}
