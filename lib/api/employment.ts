import { api } from "./client";
import type { Iso, UserSummary, UUID } from "./types";

/** One person's membership in one organization — the subject of attendance. */
export type Employment = {
  id: UUID;
  organizationId: UUID;
  userId: UUID;
  startedAt: Iso;
  endedAt: Iso | null;
  ended: boolean;
  /** This person's own required time, null while the organization's rule stands. */
  requiredMinutesPerDay: number | null;
};

export type EmploymentListItem = {
  id: UUID;
  userId: UUID;
  email: string;
  startedAt: Iso;
  endedAt: Iso | null;
  ended: boolean;
  requiredMinutesPerDay: number | null;
  user: UserSummary;
};

/**
 * The organization's roster, scoped by the backend to what the caller may read.
 * Anyone who administers nothing in it gets a 403, so the screen asks only for
 * an admin.
 */
export function listEmployments(organizationId: string): Promise<EmploymentListItem[]> {
  return api<EmploymentListItem[]>(
    `/api/employment/list?organizationId=${encodeURIComponent(organizationId)}`
  );
}

/** Null clears the override and puts the person back on the organization's figure. */
export function updateEmploymentRequiredMinutes(
  employmentId: string,
  requiredMinutesPerDay: number | null
): Promise<Employment> {
  return api<Employment>(`/api/employment/${encodeURIComponent(employmentId)}`, {
    method: "PATCH",
    body: { requiredMinutesPerDay },
  });
}
