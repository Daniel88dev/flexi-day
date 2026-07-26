import { api, API_BASE_URL, ApiError } from "./client";
import type { MemberReport, ReportFilters, ReportOverview, ReportScope } from "./report-types";

/** Serialises the filter chips the way the backend's `csvList` parser expects. */
export function reportFiltersToQuery(filters: ReportFilters): string {
  const q = new URLSearchParams();
  q.set("year", String(filters.year));
  if (filters.groupIds?.length) q.set("groupIds", filters.groupIds.join(","));
  if (filters.userIds?.length) q.set("userIds", filters.userIds.join(","));
  if (filters.types?.length) q.set("types", filters.types.join(","));
  return q.toString();
}

export function getReportScope(): Promise<ReportScope> {
  return api<ReportScope>(`/api/reports/scope`);
}

export function getReportOverview(filters: ReportFilters): Promise<ReportOverview> {
  return api<ReportOverview>(`/api/reports/overview?${reportFiltersToQuery(filters)}`);
}

export function getMemberReport(userId: string, year: number): Promise<MemberReport> {
  return api<MemberReport>(`/api/reports/members/${userId}?year=${String(year)}`);
}

/** Pulls the filename out of `Content-Disposition`, falling back to a sane default. */
export function filenameFromDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  const raw = match?.[1];
  if (!raw) return fallback;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export type ReportExportFile = {
  blob: Blob;
  filename: string;
};

/**
 * Downloads the workbook. Deliberately not routed through `api()` — that
 * helper reads every response as text, which would corrupt the binary.
 */
export async function exportReport(filters: ReportFilters): Promise<ReportExportFile> {
  const res = await fetch(`${API_BASE_URL}/api/reports/export`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filters),
  });

  if (!res.ok) {
    const text = await res.text();
    let message = res.statusText || `Request failed (${res.status})`;
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text) as unknown;
        const obj = parsed as Record<string, unknown>;
        const first = Array.isArray(obj.errors)
          ? (obj.errors[0] as { message?: string } | undefined)
          : undefined;
        message = first?.message ?? (typeof obj.message === "string" ? obj.message : message);
      } catch {
        message = text;
      }
    }
    throw new ApiError(res.status, message, parsed);
  }

  return {
    blob: await res.blob(),
    filename: filenameFromDisposition(
      res.headers.get("Content-Disposition"),
      `flexi-day-report-${String(filters.year)}.xlsx`
    ),
  };
}

/** Hands the blob to the browser as a download and releases the object URL. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
