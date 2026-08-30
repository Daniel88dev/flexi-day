import {
  CalendarRecordType,
  OTHER_CALENDAR_RECORD_TYPES,
  PRIMARY_CALENDAR_RECORD_TYPES,
} from "@/lib/api/types";

export interface LeaveMeta {
  cssVar: string;
}

// Total on purpose: adding a CalendarRecordType without a color fails
// typecheck here instead of silently rendering grey.
export const LEAVE_META: Record<CalendarRecordType, LeaveMeta> = {
  [CalendarRecordType.Vacation]: { cssVar: "var(--c-vacation)" },
  [CalendarRecordType.HomeOffice]: { cssVar: "var(--c-home)" },
  [CalendarRecordType.Sick]: { cssVar: "var(--c-sick)" },
  [CalendarRecordType.SickDay]: { cssVar: "var(--c-sickday)" },
  [CalendarRecordType.BankHoliday]: { cssVar: "var(--c-bank)" },
  [CalendarRecordType.PaidTimeOff]: { cssVar: "var(--c-pto)" },
  [CalendarRecordType.NonPaidLeave]: { cssVar: "var(--c-nonpaid)" },
  [CalendarRecordType.StudyLeave]: { cssVar: "var(--c-study)" },
  [CalendarRecordType.Other]: { cssVar: "var(--c-other)" },
};

/**
 * Chip order on the dashboard filter and legend: the everyday types, sick day
 * and bank holiday, then the rarer requestable ones.
 */
export const DEFAULT_LEAVE_TYPES: CalendarRecordType[] = [
  ...PRIMARY_CALENDAR_RECORD_TYPES,
  CalendarRecordType.SickDay,
  CalendarRecordType.BankHoliday,
  ...OTHER_CALENDAR_RECORD_TYPES,
];

export function leaveMetaFor(kind: CalendarRecordType): LeaveMeta {
  return LEAVE_META[kind];
}
