import { api } from "./client";
import type { UUID } from "./types";

export type BalanceMode = "DAILY" | "MONTHLY";

export type AttendanceSettings = {
  organizationId: UUID;
  attendanceEnabled: boolean;
  locationEnabled: boolean;
  /** IANA zone. Null until one is chosen; attendance cannot be turned on without it. */
  timezone: string | null;
  holidayCountry: string | null;
  /** `Date.getUTCDay()` numbers, 0 = Sunday. */
  workingDays: number[];
  breakMinutes: number;
  breakThresholdMinutes: number;
  requiredMinutesPerDay: number;
  balanceMode: BalanceMode;
  sessionCeilingMinutes: number;
  breakCeilingMinutes: number;
  /** Enabled *and* on a live paid plan. False the moment the subscription lapses. */
  active: boolean;
};

export type UpdateAttendanceSettingsInput = {
  organizationId?: string | null;
  attendanceEnabled: boolean;
  locationEnabled?: boolean;
  timezone?: string | null;
  holidayCountry?: string | null;
  workingDays?: number[];
  breakMinutes?: number;
  breakThresholdMinutes?: number;
  requiredMinutesPerDay?: number;
  balanceMode?: BalanceMode;
  sessionCeilingMinutes?: number;
  breakCeilingMinutes?: number;
};

const scoped = (path: string, organizationId?: string | null) =>
  organizationId ? `${path}?organizationId=${encodeURIComponent(organizationId)}` : path;

/** An organization that never set attendance up gets the defaults, not a 404. */
export function getAttendanceSettings(organizationId?: string | null): Promise<AttendanceSettings> {
  return api<AttendanceSettings>(scoped(`/api/organization/attendance-settings`, organizationId));
}

/** Full replacement: every rule the body omits is written at its default. */
export function updateAttendanceSettings(
  input: UpdateAttendanceSettingsInput
): Promise<AttendanceSettings> {
  const { organizationId, ...body } = input;
  return api<AttendanceSettings>(scoped(`/api/organization/attendance-settings`, organizationId), {
    method: "PUT",
    body,
  });
}
