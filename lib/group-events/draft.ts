import type {
  CreateGroupEventInput,
  GroupEventChanges,
  GroupEventEditRequest,
  GroupEventGroup,
  GroupEventRow,
  GroupEventScope,
  RepeatRule,
} from "@/lib/api/group-events";
import type { IsoDate } from "@/lib/api/types";
import type { GroupEventTarget } from "./day-items";
import { monthPosition, occurrences, plusDays, weekdayOf } from "./occurrences";

/** The group event sheet's form. Times stay filled while all-day is on, so switching back keeps them. */
export interface GroupEventDraft {
  groupId: string | null;
  title: string;
  note: string;
  startDate: IsoDate;
  endDate: IsoDate;
  allDay: boolean;
  startTime: string;
  endTime: string;
  /** As the user set it; `fitRule` adapts it to the start before it is shown or sent. */
  repeat: RepeatRule | null;
}

export type DraftProblem = "title" | "group" | "endsBeforeStart" | "untilBeforeStart";

const PREVIEW_COUNT = 6;
const DEFAULT_START = "09:00";
const DEFAULT_END = "10:00";

const daysBetween = (from: IsoDate, to: IsoDate): number =>
  Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

export function blankDraft(date: IsoDate, groupId: string | null): GroupEventDraft {
  return {
    groupId,
    title: "",
    note: "",
    startDate: date,
    endDate: date,
    allDay: true,
    startTime: DEFAULT_START,
    endTime: DEFAULT_END,
    repeat: null,
  };
}

export function defaultRule(freq: RepeatRule["freq"], start: IsoDate): RepeatRule {
  return {
    freq,
    interval: 1,
    weekdays: freq === "weekly" ? [weekdayOf(start)] : [],
    monthlyMode: freq === "monthly" ? "day" : null,
    until: null,
  };
}

/** The rule as the start allows it: the start's weekday always repeats, monthly modes it can't take switch. */
export function fitRule(rule: RepeatRule, start: IsoDate): RepeatRule {
  const { nth, isLast } = monthPosition(start);
  let monthlyMode = rule.freq === "monthly" ? (rule.monthlyMode ?? "day") : null;
  if (monthlyMode === "weekday" && nth > 4) monthlyMode = "lastWeekday";
  if (monthlyMode === "lastWeekday" && !isLast) monthlyMode = "weekday";
  return {
    freq: rule.freq,
    interval: rule.interval,
    weekdays:
      rule.freq === "weekly"
        ? [...new Set([...rule.weekdays, weekdayOf(start)])].sort((a, b) => a - b)
        : [],
    monthlyMode,
    until: rule.until,
  };
}

export function sameRule(a: RepeatRule | null, b: RepeatRule | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    a.freq === b.freq &&
    a.interval === b.interval &&
    (a.monthlyMode ?? null) === (b.monthlyMode ?? null) &&
    a.until === b.until &&
    [...a.weekdays].sort((x, y) => x - y).join() === [...b.weekdays].sort((x, y) => x - y).join()
  );
}

/** The next six dates the rule produces from the start, fewer when it ends sooner. */
export function nextDates(start: IsoDate, rule: RepeatRule): IsoDate[] {
  const fitted = fitRule(rule, start);
  const reach = plusDays(start, PREVIEW_COUNT * fitted.interval * 366);
  return occurrences(
    { startDate: start, endDate: start, repeat: fitted, skippedDates: [] },
    start,
    reach
  )
    .slice(0, PREVIEW_COUNT)
    .map((o) => o.startDate);
}

/**
 * Applies a date change: a moved start keeps the event's length, the end never falls before the
 * start, and a run of days cannot repeat.
 */
export function withDates(
  draft: GroupEventDraft,
  dates: { startDate?: IsoDate; endDate?: IsoDate }
): GroupEventDraft {
  const startDate = dates.startDate ?? draft.startDate;
  let endDate = dates.endDate ?? plusDays(draft.endDate, daysBetween(draft.startDate, startDate));
  if (endDate < startDate) endDate = startDate;
  return {
    ...draft,
    startDate,
    endDate,
    repeat: endDate === startDate ? draft.repeat : null,
  };
}

/**
 * The groups a new group event may go to, and the one it goes to: the one picked, else the
 * requested one if it can create, else the first that can.
 */
export function createGroups(
  groups: readonly GroupEventGroup[],
  picked: string | null,
  requested: string | null | undefined
): { creatable: GroupEventGroup[]; selected: GroupEventGroup | null } {
  const creatable = groups.filter((g) => g.canCreate);
  const selected = creatable.find((g) => g.groupId === (picked ?? requested)) ?? creatable[0];
  return { creatable, selected: selected ?? null };
}

export function draftProblem(draft: GroupEventDraft): DraftProblem | null {
  if (!draft.title.trim()) return "title";
  if (!draft.groupId) return "group";
  if (!draft.allDay && draft.startDate === draft.endDate && draft.endTime <= draft.startTime) {
    return "endsBeforeStart";
  }
  if (draft.repeat?.until && draft.repeat.until < draft.startDate) return "untilBeforeStart";
  return null;
}

function content(draft: GroupEventDraft) {
  return {
    title: draft.title.trim(),
    note: draft.note.trim() || null,
    startTime: draft.allDay ? null : draft.startTime,
    endTime: draft.allDay ? null : draft.endTime,
  };
}

export function createInput(draft: GroupEventDraft): CreateGroupEventInput {
  const { title, note, startTime, endTime } = content(draft);
  return {
    groupId: draft.groupId ?? "",
    title,
    note,
    startDate: draft.startDate,
    endDate: draft.endDate,
    startTime,
    endTime,
    repeat: draft.repeat ? fitRule(draft.repeat, draft.startDate) : null,
  };
}

const clock = (time: string | null) => time?.slice(0, 5) ?? null;

/** A recurring group event opens on the occurrence picked; a one-off on its own dates. */
export function draftFromEvent(event: GroupEventRow, occurrenceDate: IsoDate): GroupEventDraft {
  const startDate = event.repeat ? occurrenceDate : event.startDate;
  return {
    groupId: event.groupId,
    title: event.title,
    note: event.note ?? "",
    startDate,
    endDate: event.repeat ? occurrenceDate : event.endDate,
    allDay: event.startTime === null,
    startTime: clock(event.startTime) ?? DEFAULT_START,
    endTime: clock(event.endTime) ?? DEFAULT_END,
    repeat: event.repeat,
  };
}

/** The rule moved by `days`: a weekly rule's weekdays and the last date move with the start. */
export function shiftRule(rule: RepeatRule, days: number): RepeatRule {
  if (days === 0) return rule;
  return {
    ...rule,
    weekdays:
      rule.freq === "weekly"
        ? rule.weekdays.map((d) => (((d + days) % 7) + 7) % 7).sort((a, b) => a - b)
        : rule.weekdays,
    until: rule.until && plusDays(rule.until, days),
  };
}

/**
 * Moves the occurrence being edited of a recurring group event. It stays one day, and its rule
 * moves with it, so the editor and the six-date preview show the rule "This and following" and
 * "All events" save. "This event" sends no rule, so the move cannot change the others.
 */
export function moveOccurrence(draft: GroupEventDraft, startDate: IsoDate): GroupEventDraft {
  const days = daysBetween(draft.startDate, startDate);
  return {
    ...draft,
    startDate,
    endDate: startDate,
    repeat: draft.repeat && shiftRule(draft.repeat, days),
  };
}

const movedBy = (target: GroupEventTarget, draft: GroupEventDraft) =>
  daysBetween(target.occurrenceDate, draft.startDate);

/** Whether the user changed the rule itself; a rule that only moved with the date does not count. */
export function ruleChanged(target: GroupEventTarget, draft: GroupEventDraft): boolean {
  const stored = target.event.repeat;
  return !sameRule(stored && shiftRule(stored, movedBy(target, draft)), draft.repeat);
}

/**
 * The dates the sheet previews: what the picked scope saves from this occurrence on. Before a
 * scope is picked, and for "This and following" and "All events", that is the draft's rule; for
 * "This event" it is the stored rule with this one date moved.
 */
export function previewDates(
  target: GroupEventTarget | null,
  draft: GroupEventDraft,
  scope: GroupEventScope | null
): IsoDate[] {
  const stored = target?.event.repeat;
  if (target && stored && scope === "this") {
    const dates = nextDates(target.occurrenceDate, stored).filter(
      (d) => d !== target.occurrenceDate
    );
    return [...new Set([...dates, draft.startDate])].sort().slice(0, PREVIEW_COUNT);
  }
  return draft.repeat ? nextDates(draft.startDate, draft.repeat) : [];
}

/**
 * The `PATCH` for a draft whose occurrence moved through `moveOccurrence`. "This event" never
 * sends the rule. "This and following" starts the moved rule on the draft's date. "All events"
 * moves the first date by as many days as the occurrence moved, with the moved rule.
 */
export function editRequest(
  target: GroupEventTarget,
  draft: GroupEventDraft,
  scope: GroupEventScope | undefined
): GroupEventEditRequest {
  const { event, occurrenceDate } = target;
  const base = content(draft);
  const rule = (start: IsoDate, r: RepeatRule | null) => (r ? fitRule(r, start) : null);

  if (!event.repeat || !scope) {
    return {
      changes: {
        ...base,
        startDate: draft.startDate,
        endDate: draft.endDate,
        repeat: rule(draft.startDate, draft.repeat),
      },
    };
  }

  let changes: GroupEventChanges;
  if (scope === "this") {
    changes = { ...base, startDate: draft.startDate, endDate: draft.startDate };
  } else if (scope === "following") {
    changes = {
      ...base,
      startDate: draft.startDate,
      endDate: draft.endDate,
      repeat: rule(draft.startDate, draft.repeat),
    };
  } else {
    const startDate = plusDays(event.startDate, movedBy(target, draft));
    changes = {
      ...base,
      startDate,
      endDate: plusDays(startDate, daysBetween(draft.startDate, draft.endDate)),
      repeat: rule(startDate, draft.repeat),
    };
  }
  return { scope, occurrenceDate, changes };
}
