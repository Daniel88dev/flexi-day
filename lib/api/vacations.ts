import { api } from "./client";
import type {
  CreateVacationInput,
  UpdateVacationInput,
  Vacation,
  VacationDetail,
  VacationListItem,
} from "./types";

/** With `groupId` the whole group's records come back instead of the caller's own. */
export type ListVacationsParams = {
  year?: number;
  month?: number;
  groupId?: string | null;
  /** Include cancelled (soft-deleted) rows; the requests view sets this. */
  includeCancelled?: boolean;
};

export function listVacations(params: ListVacationsParams = {}): Promise<VacationListItem[]> {
  const q = new URLSearchParams();
  if (params.year !== undefined) q.set("year", String(params.year));
  if (params.month !== undefined) q.set("month", String(params.month));
  if (params.groupId) q.set("groupId", params.groupId);
  if (params.includeCancelled) q.set("includeCancelled", "true");
  const qs = q.toString();
  return api<VacationListItem[]>(`/api/vacation${qs ? `?${qs}` : ""}`);
}

/** One request with its history and the caller's permissions on it. */
export function getVacation(id: string): Promise<VacationDetail> {
  return api<VacationDetail>(`/api/vacation/${id}`);
}

export function createVacation(input: CreateVacationInput): Promise<Vacation[]> {
  return api<Vacation[]>(`/api/vacation/create-vacation`, {
    method: "POST",
    body: input,
  });
}

/** Admin-only in-place edit of one member's day rows. */
export function updateVacation(input: UpdateVacationInput): Promise<Vacation[]> {
  return api<Vacation[]>(`/api/vacation`, {
    method: "PATCH",
    body: input,
  });
}

export function approveVacation(id: string, reason?: string): Promise<{ message: string }> {
  return api<{ message: string }>(`/api/vacation/approve/${id}`, {
    method: "POST",
    body: reason ? { reason } : undefined,
  });
}

export function commentVacation(id: string, message: string): Promise<{ message: string }> {
  return api<{ message: string }>(`/api/vacation/comment/${id}`, {
    method: "POST",
    body: { message },
  });
}

export function rejectVacation(id: string, reason?: string): Promise<{ message: string }> {
  return api<{ message: string }>(`/api/vacation/reject/${id}`, {
    method: "POST",
    body: reason ? { reason } : undefined,
  });
}

export function approveVacations(
  ids: string[]
): Promise<{ message: string; approvedCount: number }> {
  return api<{ message: string; approvedCount: number }>(`/api/vacation/approve`, {
    method: "POST",
    body: { ids },
  });
}

export function rejectVacations(
  ids: string[],
  reason?: string
): Promise<{ message: string; rejectedCount: number }> {
  return api<{ message: string; rejectedCount: number }>(`/api/vacation/reject`, {
    method: "POST",
    body: reason ? { ids, reason } : { ids },
  });
}

export function cancelVacations(ids: string[], reason?: string): Promise<{ message: string }> {
  return api<{ message: string }>(`/api/vacation/cancel`, {
    method: "POST",
    body: reason ? { ids, reason } : { ids },
  });
}
