import { api } from "./client";
import type { DashboardSummary, IsoDate } from "./types";

export function getDashboardSummary(today: IsoDate): Promise<DashboardSummary> {
  return api<DashboardSummary>(`/api/users/me/dashboard-summary?today=${today}`);
}
