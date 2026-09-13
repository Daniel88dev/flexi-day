import type { AttendanceExclusion } from "@/lib/api/attendance";
import type { CalendarRecordType } from "@/lib/api/types";
import type { Dictionary } from "@/lib/i18n";
import { recordTypeLabel } from "@/lib/i18n/record-type-label";

/**
 * What a day off says about itself. A holiday and an absence name themselves —
 * "St Wenceslas Day" beats "Public holiday", and the record type is what the
 * person booked — and the backend sends the label for both, so the cause is
 * only the fallback for a row that has none.
 */
export function exclusionLabel(t: Dictionary, exclusion: AttendanceExclusion): string {
  const label = ((): string => {
    switch (exclusion.cause) {
      case "NOT_EMPLOYED":
        return t.clock.notEmployed;
      case "NON_WORKING_DAY":
        return t.clock.nonWorkingDay;
      case "HOLIDAY":
        return exclusion.label ?? t.clock.publicHoliday;
      case "ABSENCE":
        return exclusion.label
          ? recordTypeLabel(t.calendarRecordTypes, exclusion.label as CalendarRecordType)
          : t.clock.absent;
      default:
        // A newer backend can send a cause this build has never heard of, and
        // "the day is off" is still the useful half of the answer.
        return t.clock.dayOff;
    }
  })();

  return exclusion.extent === "HALF" ? t.clock.halfDayTag(label) : label;
}
