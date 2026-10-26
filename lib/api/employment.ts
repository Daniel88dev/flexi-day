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
  accountDeletedAt: Iso | null;
  accountDeleted: boolean;
  /** Optional as a backend older than this build sends none. */
  type?: "employee" | "external";
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

export type EndedEmployment = Employment & { cancelledBookings: number };

/**
 * End employment: the person leaves every group of the organization and their
 * pending and future bookings are cancelled. `endedOn` is the last day of the
 * spell, today or earlier in the organization's zone.
 */
export function endEmployment(employmentId: string, endedOn: string): Promise<EndedEmployment> {
  return api<EndedEmployment>(`/api/employment/${encodeURIComponent(employmentId)}/end`, {
    method: "POST",
    body: { endedOn },
  });
}

/**
 * Erase: removes everything the organization holds about a Deleted account,
 * ending an open Employment first. `confirmName` is the name the admin typed;
 * the backend refuses one that isn't the person's.
 */
export function eraseEmployment(employmentId: string, confirmName: string): Promise<void> {
  return api<void>(`/api/employment/${encodeURIComponent(employmentId)}/erase`, {
    method: "POST",
    body: { confirmName },
  });
}
