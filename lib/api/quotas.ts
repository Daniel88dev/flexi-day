import { api } from "./client";
import type { CarryOverSuggestion, SetUserQuotaInput, UserYearQuota } from "./types";

export type ListQuotasParams = { year?: number; userId?: string };

export function listQuotas(
  groupId: string,
  params: ListQuotasParams = {}
): Promise<UserYearQuota[]> {
  const q = new URLSearchParams();
  if (params.year !== undefined) q.set("year", String(params.year));
  if (params.userId) q.set("userId", params.userId);
  const qs = q.toString();
  return api<UserYearQuota[]>(`/api/quotas/${groupId}${qs ? `?${qs}` : ""}`);
}

/** Admin-only: create or replace a member's allowance for one year. */
export function setUserQuota({ groupId, ...body }: SetUserQuotaInput): Promise<UserYearQuota> {
  return api<UserYearQuota>(`/api/quotas/${groupId}`, { method: "PUT", body });
}

/** Admin-only: last year's leftover, used to pre-fill the carry-over field. */
export function getCarryOverSuggestion(
  groupId: string,
  userId: string,
  year: number
): Promise<CarryOverSuggestion> {
  const q = new URLSearchParams({ userId, year: String(year) });
  return api<CarryOverSuggestion>(`/api/quotas/${groupId}/carryover-suggestion?${q.toString()}`);
}
