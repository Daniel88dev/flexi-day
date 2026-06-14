import { api } from "./client";
import type { CreateVacationInput, Vacation, VacationListItem } from "./types";

export type ListVacationsParams = { year?: number; month?: number };

export function listVacations(params: ListVacationsParams = {}): Promise<VacationListItem[]> {
  const q = new URLSearchParams();
  if (params.year !== undefined) q.set("year", String(params.year));
  if (params.month !== undefined) q.set("month", String(params.month));
  const qs = q.toString();
  return api<VacationListItem[]>(`/api/vacation${qs ? `?${qs}` : ""}`);
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

export function cancelVacation(id: string): Promise<{ message: string }> {
  return api<{ message: string }>(`/api/vacation/${id}`, { method: "DELETE" });
}
