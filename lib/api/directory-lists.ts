import type { Locale } from "@/lib/i18n/config";
import { api } from "./client";
import type { DirectoryCountry } from "./directory";

export type DirectoryListKind = "departments" | "locations";

/** A Department or Location as a record holds it. */
export type DirectoryEntryRef = { id: string; name: string; archived: boolean };

export type DirectoryListEntry = DirectoryEntryRef & {
  /** Locations only. */
  country?: DirectoryCountry | null;
  /** A record, open or former, holds it, so it can be archived but not deleted. Managers only. */
  inUse?: boolean;
};

export type DirectoryList = {
  /** The viewer may add, rename, archive and delete. */
  editable: boolean;
  /** The plan passes the directory gate; while lapsed nothing can be added or restored. */
  writable: boolean;
  entries: DirectoryListEntry[];
};

export type DirectoryListEntryChange = {
  name?: string;
  archived?: boolean;
  /** Locations only; null clears it. */
  country?: string | null;
};

const listPath = (organizationId: string, kind: DirectoryListKind, rest = "", language?: Locale) =>
  `/api/directory/${encodeURIComponent(organizationId)}/${kind}${rest}${language ? `?language=${language}` : ""}`;

/** Anyone in the directory reads the lists, archived entries included. */
export function getDirectoryList(
  organizationId: string,
  kind: DirectoryListKind,
  language?: Locale
): Promise<DirectoryList> {
  return api<DirectoryList>(listPath(organizationId, kind, "", language));
}

export function addDirectoryListEntry(
  organizationId: string,
  kind: DirectoryListKind,
  entry: { name: string; country?: string | null },
  language?: Locale
): Promise<DirectoryListEntry> {
  return api<DirectoryListEntry>(listPath(organizationId, kind, "", language), {
    method: "POST",
    body: entry,
  });
}

export function updateDirectoryListEntry(
  organizationId: string,
  kind: DirectoryListKind,
  entryId: string,
  change: DirectoryListEntryChange,
  language?: Locale
): Promise<DirectoryListEntry> {
  return api<DirectoryListEntry>(
    listPath(organizationId, kind, `/${encodeURIComponent(entryId)}`, language),
    { method: "PATCH", body: change }
  );
}

/** Only while no record holds the entry; otherwise archive it. */
export function deleteDirectoryListEntry(
  organizationId: string,
  kind: DirectoryListKind,
  entryId: string
): Promise<void> {
  return api<void>(listPath(organizationId, kind, `/${encodeURIComponent(entryId)}`), {
    method: "DELETE",
  });
}
