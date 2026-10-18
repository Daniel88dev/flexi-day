import { api } from "./client";

export type MyBirthday = {
  month: number;
  day: number;
  year: number | null;
  shared: boolean;
};

export type BirthdayShareGroup = { groupId: string; groupName: string };

export type BirthdaySettings = {
  birthday: MyBirthday | null;
  /** Whether the share switch may turn on: one of the user's groups is on a paid plan. */
  canShare: boolean;
  /** The paid and lapsed groups a shared birthday shows in today. */
  shareGroups: BirthdayShareGroup[];
};

export const BIRTHDAY_SHARE_PLAN_REQUIRED = "BIRTHDAY_SHARE_PLAN_REQUIRED";

export function getMyBirthday(): Promise<BirthdaySettings> {
  return api<BirthdaySettings>(`/api/users/me/birthday`);
}

export function putMyBirthday(input: MyBirthday): Promise<BirthdaySettings> {
  return api<BirthdaySettings>(`/api/users/me/birthday`, { method: "PUT", body: input });
}

export function deleteMyBirthday(): Promise<void> {
  return api<void>(`/api/users/me/birthday`, { method: "DELETE" });
}
