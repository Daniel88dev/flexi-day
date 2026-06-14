import { api } from "./client";
import type { PendingApproval } from "./types";

export function listMyApprovals(): Promise<PendingApproval[]> {
  return api<PendingApproval[]>(`/api/users/me/approvals`);
}
