import { afterEach, describe, expect, it, vi } from "vitest";
import {
  closeGroupEventSheet,
  confirmGroupEventDelete,
  groupEventSheetState,
  openGroupEventEditor,
  openGroupEventSheet,
  setShownGroupEventGroup,
  shownGroupEventGroup,
  subscribeGroupEventSheet,
} from "../sheet-store";
import type { GroupEventTarget } from "../day-items";

const target = { event: { id: "ge-1" }, occurrenceDate: "2026-10-19" } as GroupEventTarget;

describe("group event sheet store", () => {
  afterEach(() => closeGroupEventSheet());

  it("starts closed", () => {
    expect(groupEventSheetState()).toBeNull();
  });

  it("opens a new group event on a date and group and tells subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeGroupEventSheet(listener);
    const onCreated = vi.fn();

    openGroupEventSheet({ date: "2026-10-21", groupId: "g-1", onCreated });

    expect(groupEventSheetState()).toMatchObject({
      kind: "create",
      date: "2026-10-21",
      groupId: "g-1",
      onCreated,
    });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("opens on today when no date is given", () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 18, 9) });
    openGroupEventSheet();
    expect(groupEventSheetState()).toMatchObject({ kind: "create", date: "2026-10-18" });
    vi.useRealTimers();
  });

  it("opens the editor and the delete question on a target", () => {
    openGroupEventEditor(target);
    expect(groupEventSheetState()).toMatchObject({ kind: "edit", target });
    confirmGroupEventDelete(target);
    expect(groupEventSheetState()).toMatchObject({ kind: "delete", target });
  });

  it("gives every opening its own id, so the form starts fresh", () => {
    openGroupEventSheet({ date: "2026-10-21" });
    const first = groupEventSheetState()!.id;
    openGroupEventSheet({ date: "2026-10-21" });
    expect(groupEventSheetState()!.id).not.toBe(first);
  });

  it("remembers the group the dashboard shows until it reports none", () => {
    expect(shownGroupEventGroup()).toBeNull();
    setShownGroupEventGroup("g-1");
    expect(shownGroupEventGroup()).toBe("g-1");
    setShownGroupEventGroup(null);
    expect(shownGroupEventGroup()).toBeNull();
  });
});
