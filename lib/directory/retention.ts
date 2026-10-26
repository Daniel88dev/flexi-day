import { RETENTION_PERIODS, type RetentionPeriod } from "@/lib/api/directory";

/** A move to an earlier period on the list, which removes data at the next nightly run. */
export function isShortening(from: RetentionPeriod, to: RetentionPeriod): boolean {
  return RETENTION_PERIODS.indexOf(to) < RETENTION_PERIODS.indexOf(from);
}
