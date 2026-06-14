import { api } from "./client";
import type { BalanceSummary } from "./types";

export function getMyBalances(year: number): Promise<BalanceSummary> {
  return api<BalanceSummary>(`/api/users/me/balances?year=${year}`);
}
