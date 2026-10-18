import { api } from "./client";
import type { IsoDate, UserSummary } from "./types";

/** One birthday falling in the padded month window of `GET /api/birthdays`. */
export type BirthdayCalendarRow = {
  userId: string;
  user: UserSummary;
  /** The day it shows on: 29 February comes back as 28 February in a non-leap year. */
  date: IsoDate;
  month: number;
  day: number;
  year: number | null;
  /** The age turned on `date`, or null without a year. */
  age: number | null;
};

export type ListBirthdaysParams = {
  year: number;
  /** 1-12. */
  month: number;
  /** A group the caller sees in full; without it, only the caller's own birthday. */
  groupId?: string | null;
};

export function listBirthdays(params: ListBirthdaysParams): Promise<BirthdayCalendarRow[]> {
  const q = new URLSearchParams({ year: String(params.year), month: String(params.month) });
  if (params.groupId) q.set("groupId", params.groupId);
  return api<BirthdayCalendarRow[]>(`/api/birthdays?${q.toString()}`);
}
