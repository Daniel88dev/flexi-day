import type { DirectoryEntryRef } from "@/lib/api/directory-lists";

type HoldsEntries = {
  department?: DirectoryEntryRef | null;
  location?: DirectoryEntryRef | null;
};

/** The entry's name, or "Name (archived)" for an archived one. */
export function entryLabel(entry: DirectoryEntryRef, archived: (name: string) => string): string {
  return entry.archived ? archived(entry.name) : entry.name;
}

/** Each Department or Location the rows hold, once, by name: the directory filter's options. */
export function entryFilterOptions(
  people: HoldsEntries[],
  key: "department" | "location"
): DirectoryEntryRef[] {
  const byId = new Map<string, DirectoryEntryRef>();
  for (const person of people) {
    const entry = person[key];
    if (entry) byId.set(entry.id, entry);
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** The directory's department and location filters; `""` lets everyone through. */
export function matchesEntries(
  person: HoldsEntries,
  filters: { departmentId: string; locationId: string }
): boolean {
  return (
    (filters.departmentId === "" || person.department?.id === filters.departmentId) &&
    (filters.locationId === "" || person.location?.id === filters.locationId)
  );
}

/** A picker's entries: archived ones leave it, except the one the record already holds. */
export function pickerEntries<T extends DirectoryEntryRef>(
  entries: T[],
  heldId: string | null
): T[] {
  return entries.filter((entry) => !entry.archived || entry.id === heldId);
}
