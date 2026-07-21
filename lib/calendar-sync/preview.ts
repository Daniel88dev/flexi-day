import { VacationKind } from "@/lib/api/types";
import type { VacationListItem } from "@/lib/api/types";
import { colorFor, type BuilderConfig } from "./meta";

/** One contiguous block of time off, ready to render in the builder preview. */
export type PreviewEntry = {
  id: string;
  type: VacationKind;
  from: number; // day-of-month, inclusive
  to: number; // day-of-month, inclusive
  name: string; // owner display name
  isMine: boolean;
  color: string; // resolved CSS color
  note: string | null;
};

/** Which of a config's vacations belong in its feed, for the given month. */
export function feedVacations(
  config: Pick<BuilderConfig, "scope" | "teamIds" | "types">,
  vacations: VacationListItem[],
  currentUserId: string,
  year: number,
  month: number // 1-12
): VacationListItem[] {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const typeSet = new Set(config.types);
  const teamSet = new Set(config.teamIds);
  return vacations.filter((v) => {
    if (!v.requestedDay.startsWith(prefix)) return false;
    if (!typeSet.has(v.vacationType)) return false;
    // Bank holidays are company-wide — always included when their type is on.
    if (v.vacationType === VacationKind.BankHoliday) return true;
    if (config.scope === "ME") return v.userId === currentUserId;
    return teamSet.has(v.groupId);
  });
}

/**
 * Groups a config's feed vacations into contiguous day ranges (per user+type)
 * with the feed's chosen color applied. Pure — safe to unit-test.
 */
export function buildPreviewEntries(
  config: BuilderConfig,
  vacations: VacationListItem[],
  currentUserId: string,
  year: number,
  month: number
): PreviewEntry[] {
  const included = feedVacations(config, vacations, currentUserId, year, month);
  const sorted = [...included].sort((a, b) => {
    if (a.userId !== b.userId) return a.userId < b.userId ? -1 : 1;
    if (a.vacationType !== b.vacationType) return a.vacationType < b.vacationType ? -1 : 1;
    return a.requestedDay < b.requestedDay ? -1 : 1;
  });

  const entries: PreviewEntry[] = [];
  let current: PreviewEntry | null = null;
  let lastIso: string | null = null;
  let lastKey: string | null = null;
  let seq = 0;

  for (const v of sorted) {
    const day = Number(v.requestedDay.slice(8, 10));
    const key = `${v.userId}|${v.vacationType}`;
    if (current && key === lastKey && lastIso && isNextDay(lastIso, v.requestedDay)) {
      current.to = day;
    } else {
      const isMine = v.userId === currentUserId;
      current = {
        id: `p${seq++}`,
        type: v.vacationType,
        from: day,
        to: day,
        name: isMine ? "You" : v.user.name,
        isMine,
        color: colorFor(config, v.vacationType, isMine),
        note: v.note,
      };
      entries.push(current);
    }
    lastIso = v.requestedDay;
    lastKey = key;
  }
  return entries;
}

function isNextDay(a: string, b: string) {
  return new Date(b).getTime() - new Date(a).getTime() === 24 * 60 * 60 * 1000;
}
