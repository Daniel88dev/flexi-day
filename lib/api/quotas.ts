import { api } from "./client";
import type { UserYearQuota } from "./types";

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
