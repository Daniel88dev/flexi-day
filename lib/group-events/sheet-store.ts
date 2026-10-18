import type { GroupEventRow } from "@/lib/api/group-events";
import type { IsoDate } from "@/lib/api/types";
import { localDayOf } from "@/lib/calendar/month-grid";
import type { GroupEventTarget } from "./day-items";

export interface OpenGroupEventSheetOptions {
  /** The first day; today when left out. */
  date?: IsoDate;
  /** Preselects this group when the viewer may create in it; otherwise the first group that can. */
  groupId?: string | null;
  onCreated?: (event: GroupEventRow) => void;
}

export type GroupEventSheetState =
  | ({ kind: "create"; id: number; date: IsoDate } & Omit<OpenGroupEventSheetOptions, "date">)
  | { kind: "edit"; id: number; target: GroupEventTarget }
  | { kind: "delete"; id: number; target: GroupEventTarget };

// A module store rather than a context, like `pushToast`: any component opens the sheet, and
// `GroupEventSheetHost` in the app layout renders it.
let state: GroupEventSheetState | null = null;
let seq = 0;
const listeners = new Set<() => void>();

function set(next: GroupEventSheetState | null) {
  state = next;
  listeners.forEach((fn) => fn());
}

export function subscribeGroupEventSheet(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function groupEventSheetState(): GroupEventSheetState | null {
  return state;
}

export function openGroupEventSheet(options: OpenGroupEventSheetOptions = {}) {
  const { date, ...rest } = options;
  set({ kind: "create", id: ++seq, date: date ?? localDayOf(new Date()), ...rest });
}

export function openGroupEventEditor(target: GroupEventTarget) {
  set({ kind: "edit", id: ++seq, target });
}

export function confirmGroupEventDelete(target: GroupEventTarget) {
  set({ kind: "delete", id: ++seq, target });
}

export function closeGroupEventSheet() {
  set(null);
}

let shownGroupId: string | null = null;

/** The dashboard reports the group it shows in Group scope (null in Mine), for the sheet's default group. */
export function setShownGroupEventGroup(groupId: string | null) {
  shownGroupId = groupId;
}

export function shownGroupEventGroup(): string | null {
  return shownGroupId;
}
