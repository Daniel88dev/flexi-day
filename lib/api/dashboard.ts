import { api } from "./client";
import type { DashboardSummary } from "./types";

export function getDashboardSummary(): Promise<DashboardSummary> {
  return api<DashboardSummary>(`/api/users/me/dashboard-summary`);
}
