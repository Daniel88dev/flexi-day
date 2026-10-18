import {
  AWAY_RECORD_TYPE,
  CalendarRecordType,
  OTHER_CALENDAR_RECORD_TYPES,
  PRIMARY_CALENDAR_RECORD_TYPES,
  type WireRecordType,
} from "@/lib/api/types";

export interface LeaveMeta {
  cssVar: string;
}

// Total on purpose: adding a CalendarRecordType without a color fails
// typecheck here instead of silently rendering grey.
export const LEAVE_META: Record<WireRecordType, LeaveMeta> = {
  [CalendarRecordType.Vacation]: { cssVar: "var(--c-vacation)" },
  [CalendarRecordType.HomeOffice]: { cssVar: "var(--c-home)" },
  [CalendarRecordType.Sick]: { cssVar: "var(--c-sick)" },
  [CalendarRecordType.SickDay]: { cssVar: "var(--c-sickday)" },
  [CalendarRecordType.BankHoliday]: { cssVar: "var(--c-bank)" },
  [CalendarRecordType.PaidTimeOff]: { cssVar: "var(--c-pto)" },
  [CalendarRecordType.NonPaidLeave]: { cssVar: "var(--c-nonpaid)" },
  [CalendarRecordType.StudyLeave]: { cssVar: "var(--c-study)" },
  [CalendarRecordType.Other]: { cssVar: "var(--c-other)" },
  [AWAY_RECORD_TYPE]: { cssVar: "var(--c-away)" },
};

/**
 * Chip order on the dashboard filter and legend: the everyday types, sick day
 * and bank holiday, the rarer requestable ones, then Away. Away has a chip of
 * its own: riding with Sick would tell a teammate which Away rows are sick leave.
 */
export const DEFAULT_LEAVE_TYPES: WireRecordType[] = [
  ...PRIMARY_CALENDAR_RECORD_TYPES,
  CalendarRecordType.SickDay,
  CalendarRecordType.BankHoliday,
  ...OTHER_CALENDAR_RECORD_TYPES,
  AWAY_RECORD_TYPE,
];

// The map stays total for exhaustiveness, but the lookup must survive a value
// a newer backend ships before this build knows it.
const UNKNOWN_LEAVE_META: LeaveMeta = { cssVar: "var(--text-muted)" };

export function leaveMetaFor(kind: WireRecordType): LeaveMeta {
  return LEAVE_META[kind] ?? UNKNOWN_LEAVE_META;
}
