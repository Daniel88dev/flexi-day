import { CalendarRecordType } from "@/lib/api/types";

export interface LeaveMeta {
  id: CalendarRecordType;
  label: string;
  short: string;
  cssVar: string;
}

// Deliberately partial: only the types the dashboard renders first-class today.
export const LEAVE_META: Partial<Record<CalendarRecordType, LeaveMeta>> = {
  [CalendarRecordType.Vacation]: {
    id: CalendarRecordType.Vacation,
    label: "Vacation",
    short: "Vac",
    cssVar: "var(--c-vacation)",
  },
  [CalendarRecordType.HomeOffice]: {
    id: CalendarRecordType.HomeOffice,
    label: "Home Office",
    short: "WFH",
    cssVar: "var(--c-home)",
  },
  [CalendarRecordType.Sick]: {
    id: CalendarRecordType.Sick,
    label: "Sick",
    short: "Sick",
    cssVar: "var(--c-sick)",
  },
  [CalendarRecordType.BankHoliday]: {
    id: CalendarRecordType.BankHoliday,
    label: "Bank Holiday",
    short: "Bank",
    cssVar: "var(--c-bank)",
  },
  [CalendarRecordType.PaidTimeOff]: {
    id: CalendarRecordType.PaidTimeOff,
    label: "Paid Time Off",
    short: "PTO",
    cssVar: "var(--c-pto)",
  },
};

export const DEFAULT_LEAVE_TYPES: CalendarRecordType[] = [
  CalendarRecordType.Vacation,
  CalendarRecordType.HomeOffice,
  CalendarRecordType.Sick,
  CalendarRecordType.BankHoliday,
  CalendarRecordType.PaidTimeOff,
];

export function leaveMetaFor(kind: CalendarRecordType): LeaveMeta {
  return (
    LEAVE_META[kind] ?? {
      id: kind,
      label: kind,
      short: kind.slice(0, 3),
      cssVar: "var(--text-muted)",
    }
  );
}
