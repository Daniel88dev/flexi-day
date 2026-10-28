import { api } from "./client";
import type { Iso, UUID } from "./types";

export type PersonExportStatus = "PENDING" | "READY" | "FAILED";

export type PersonExportScope = "PERSON" | "ORGANIZATION";

/** One Person or Organization export: `PENDING` while the ZIP is built, then `READY` for 7 days. */
export type PersonExport = {
  id: UUID;
  organizationId: UUID;
  scope: PersonExportScope;
  /** Null for an Organization export and for a person without an account. */
  subjectUserId: string | null;
  /** The Employment of a person without an account the export is about. */
  subjectEmploymentId?: string | null;
  status: PersonExportStatus;
  createdAt: Iso;
  readyAt: Iso | null;
  expiresAt: Iso | null;
};

export type OwnExportOrganization = {
  organizationId: UUID;
  organizationName: string;
  employmentId: UUID;
  startedAt: Iso;
  endedAt: Iso | null;
  timezone: string;
  export: PersonExport | null;
};

export type SignedDownload = { url: string; expiresAt: Iso };

/** An admin's request, from the person's People card row. */
export function requestPersonExport(employmentId: string): Promise<PersonExport> {
  return api<PersonExport>(`/api/employment/${encodeURIComponent(employmentId)}/export`, {
    method: "POST",
  });
}

/** The newest export per person the caller requested in the organization. */
export function listRequestedExports(organizationId: string): Promise<PersonExport[]> {
  return api<PersonExport[]>(
    `/api/employment/exports?organizationId=${encodeURIComponent(organizationId)}`
  );
}

/** Every organization the caller's account is bound to, with their newest export of themselves. */
export async function listOwnExportOrganizations(): Promise<OwnExportOrganization[]> {
  const res = await api<{ organizations: OwnExportOrganization[] }>("/api/users/me/person-exports");
  return res.organizations;
}

export function requestOwnPersonExport(organizationId: string): Promise<PersonExport> {
  return api<PersonExport>("/api/users/me/person-exports", {
    method: "POST",
    body: { organizationId },
  });
}

/** The owner's export of the whole organization. */
export function requestOrganizationExport(organizationId: string): Promise<PersonExport> {
  return api<PersonExport>(
    `/api/organization/export?organizationId=${encodeURIComponent(organizationId)}`,
    { method: "POST" }
  );
}

/** The owner's newest Organization export that has not expired, or null. */
export async function getOrganizationExport(organizationId: string): Promise<PersonExport | null> {
  const res = await api<{ export: PersonExport | null }>(
    `/api/organization/export?organizationId=${encodeURIComponent(organizationId)}`
  );
  return res.export;
}

/** A fresh link to the ZIP, valid for an hour. */
export function signPersonExportDownload(exportId: string): Promise<SignedDownload> {
  return api<SignedDownload>(`/api/person-exports/${encodeURIComponent(exportId)}/download`, {
    method: "POST",
  });
}

/** The link answers with an attachment, so following it downloads and leaves the page alone. */
export function followDownloadLink(url: string): void {
  window.location.assign(url);
}
