import { correlationHeaders } from "@/lib/observability/session";
import { API_BASE_URL, ApiError } from "./client";
import { filenameFromDisposition } from "./reports";

export type AccountExportFile = {
  blob: Blob;
  filename: string;
};

const FALLBACK_FILENAME = "flexi-day-account.json";

function errorMessage(text: string, fallback: string): string {
  if (!text) return fallback;
  try {
    const obj = JSON.parse(text) as { errors?: { message?: string }[]; message?: string };
    return obj.errors?.[0]?.message ?? obj.message ?? fallback;
  } catch {
    return text;
  }
}

/**
 * The caller's Account export, as the file the server names. Bypasses `api()`, which would
 * parse the body: the bytes go to the browser's download as they arrived.
 */
export async function downloadAccountExport(): Promise<AccountExportFile> {
  const res = await fetch(`${API_BASE_URL}/api/users/me/export`, {
    method: "GET",
    credentials: "include",
    headers: correlationHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    const message = errorMessage(text, res.statusText || `Request failed (${res.status})`);
    throw new ApiError(res.status, message, text);
  }

  return {
    blob: await res.blob(),
    filename: filenameFromDisposition(res.headers.get("Content-Disposition"), FALLBACK_FILENAME),
  };
}
