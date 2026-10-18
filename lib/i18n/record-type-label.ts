import { isKnownWireRecordType, type WireRecordType } from "@/lib/api/types";

type RecordTypeEntries = Record<WireRecordType, { label: string; short: string }>;

/**
 * Total label lookup for server-supplied types: a newer backend can serve enum
 * members this build has never heard of, and a raw stored value beats a crash.
 */
export function recordTypeLabel(entries: RecordTypeEntries, type: WireRecordType): string {
  return isKnownWireRecordType(type) ? entries[type].label : String(type);
}
