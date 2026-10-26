"use client";

import type { DirectoryEntryRef } from "@/lib/api/directory-lists";
import { entryLabel, pickerEntries } from "@/lib/directory/entries";
import { useTranslation } from "@/lib/i18n/use-translation";

/** The `<option>`s of a Department or Location picker; `currentId` keeps an archived pick listed. */
export function EntryOptions({
  entries,
  currentId = null,
}: {
  entries: DirectoryEntryRef[];
  currentId?: string | null;
}) {
  const { t } = useTranslation();
  return (
    <>
      {pickerEntries(entries, currentId).map((entry) => (
        <option key={entry.id} value={entry.id}>
          {entryLabel(entry, t.directory.archivedEntry)}
        </option>
      ))}
    </>
  );
}
