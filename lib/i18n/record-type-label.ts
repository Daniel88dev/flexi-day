import { isKnownCalendarRecordType, type CalendarRecordType } from "@/lib/api/types";

type RecordTypeEntries = Record<CalendarRecordType, { label: string; short: string }>;

/**
 * Total label lookup for server-supplied types: a newer backend can serve enum
 * members this build has never heard of, and a raw stored value beats a crash.
 */
export function recordTypeLabel(entries: RecordTypeEntries, type: CalendarRecordType): string {
  return isKnownCalendarRecordType(type) ? entries[type].label : String(type);
}
