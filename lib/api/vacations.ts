import { api } from "./client";
import type { CreateVacationInput, Vacation, VacationDetail, VacationListItem } from "./types";

export type ListVacationsParams = { year?: number; month?: number };

export function listVacations(params: ListVacationsParams = {}): Promise<VacationListItem[]> {
  const q = new URLSearchParams();
  if (params.year !== undefined) q.set("year", String(params.year));
  if (params.month !== undefined) q.set("month", String(params.month));
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

export function approveVacation(id: string): Promise<{ message: string }> {
  return api<{ message: string }>(`/api/vacation/approve/${id}`, { method: "POST" });
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

export function cancelVacation(id: string, reason?: string): Promise<{ message: string }> {
  return api<{ message: string }>(`/api/vacation/${id}`, {
    method: "DELETE",
    body: reason ? { reason } : undefined,
  });
}
