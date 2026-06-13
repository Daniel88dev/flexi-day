import { VacationKind } from "@/lib/api/types";

export type LeaveTypeKey =
  | VacationKind.Vacation
  | VacationKind.HomeOffice
  | VacationKind.Sick
  | VacationKind.BankHoliday
  | VacationKind.PaidTimeOff;

export interface LeaveMeta {
  id: LeaveTypeKey;
  label: string;
  short: string;
  cssVar: string;
}

export const LEAVE_META: Record<LeaveTypeKey, LeaveMeta> = {
  [VacationKind.Vacation]: {
    id: VacationKind.Vacation,
    label: "Vacation",
    short: "Vac",
    cssVar: "var(--c-vacation)",
  },
  [VacationKind.HomeOffice]: {
    id: VacationKind.HomeOffice,
    label: "Home Office",
    short: "WFH",
    cssVar: "var(--c-home)",
  },
  [VacationKind.Sick]: {
    id: VacationKind.Sick,
    label: "Sick",
    short: "Sick",
    cssVar: "var(--c-sick)",
  },
  [VacationKind.BankHoliday]: {
    id: VacationKind.BankHoliday,
    label: "Bank Holiday",
    short: "Bank",
    cssVar: "var(--c-bank)",
  },
  [VacationKind.PaidTimeOff]: {
    id: VacationKind.PaidTimeOff,
    label: "Paid Time Off",
    short: "PTO",
    cssVar: "var(--c-pto)",
  },
};

export const DEFAULT_LEAVE_TYPES: LeaveTypeKey[] = [
  VacationKind.Vacation,
  VacationKind.HomeOffice,
  VacationKind.Sick,
  VacationKind.BankHoliday,
  VacationKind.PaidTimeOff,
];

export function leaveMetaFor(kind: VacationKind): LeaveMeta {
  return (
    LEAVE_META[kind as LeaveTypeKey] ?? {
      id: kind as LeaveTypeKey,
      label: kind,
      short: kind.slice(0, 3),
      cssVar: "var(--text-muted)",
    }
  );
}
