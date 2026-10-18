import { describe, expect, it, vi } from "vitest";
import { groupEventDayItems } from "../day-items";
import type { GroupEventRow } from "@/lib/api/group-events";
import { en } from "@/lib/i18n/dictionaries/en";

const WINDOW = { from: "2026-09-28", to: "2026-11-08" };
const BOB = { id: "u-bob", name: "Bob Dvorak", initials: "BD", avatarColor: "hsl(0 0% 50%)" };

function row(patch: Partial<GroupEventRow>): GroupEventRow {
  return {
    id: "ge-1",
    groupId: "g-1",
    groupName: "Dev Team",
    title: "Offsite",
    note: null,
    startDate: "2026-10-21",
    endDate: "2026-10-21",
    startTime: null,
    endTime: null,
    repeat: null,
    skippedDates: [],
    recurringEventId: null,
    originalDate: null,
    createdBy: BOB,
    canEdit: false,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...patch,
  };
}

const ctx = { viewerId: "u-me", showGroup: false, t: en };

describe("groupEventDayItems", () => {
  it("puts a multi-day event on every day it covers, flagged for the ribbon", () => {
    const items = groupEventDayItems([row({ endDate: "2026-10-23" })], WINDOW, ctx);

    expect(items.map((i) => i.date)).toEqual(["2026-10-21", "2026-10-22", "2026-10-23"]);
    expect(items.every((i) => i.kind === "groupEvent" && i.spansDays)).toBe(true);
    expect(items[0].card?.when).toBe("Wed 21 Oct – Fri 23 Oct · All day");
  });

  it("keeps a multi-day event's days inside the window", () => {
    const items = groupEventDayItems(
      [row({ startDate: "2026-09-26", endDate: "2026-09-29" })],
      WINDOW,
      ctx
    );
    expect(items.map((i) => i.date)).toEqual(["2026-09-28", "2026-09-29"]);
  });

  it("shows a recurring event on each occurrence and not on its skipped dates", () => {
    const standup = row({
      title: "Standup",
      startDate: "2026-10-05",
      endDate: "2026-10-05",
      startTime: "09:30",
      endTime: "09:45",
      repeat: { freq: "weekly", interval: 1, weekdays: [0], monthlyMode: null, until: null },
      skippedDates: ["2026-10-19"],
    });

    const items = groupEventDayItems([standup], WINDOW, ctx);

    expect(items.map((i) => i.date)).toEqual([
      "2026-10-05",
      "2026-10-12",
      "2026-10-26",
      "2026-11-02",
    ]);
    expect(items.some((i) => i.spansDays)).toBe(false);
    expect(items[0].card?.when).toBe("Mon 5 Oct · 09:30–09:45");
    expect(items[0].card?.repeat).toBe("Every week on Mon");
  });

  it("writes a timed multi-day event's times beside its dates", () => {
    const [first] = groupEventDayItems(
      [row({ endDate: "2026-10-22", startTime: "16:00", endTime: "10:00" })],
      WINDOW,
      ctx
    );
    expect(first.card?.when).toBe("Wed 21 Oct 16:00 – Thu 22 Oct 10:00");
  });

  it("gives a non-editor the lock line and no actions", () => {
    const [item] = groupEventDayItems([row({ canEdit: false })], WINDOW, ctx);

    expect(item.card?.locked).toBe("Only Bob or a group admin can change this");
    expect(item.card?.addedBy).toBe("Added by Bob Dvorak");
    expect(item.actions).toBeUndefined();
  });

  it("gives an editor Edit and Delete, handing over the event and the occurrence", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const event = row({ canEdit: true, endDate: "2026-10-22" });
    const [, second] = groupEventDayItems([event], WINDOW, {
      ...ctx,
      handlers: { onEdit, onDelete },
    });

    expect(second.card?.locked).toBeUndefined();
    expect(second.actions?.map((a) => [a.label, !!a.destructive])).toEqual([
      ["Edit", false],
      ["Delete", true],
    ]);
    second.actions?.[0].onSelect?.();
    second.actions?.[1].onSelect?.();
    const target = { event, occurrenceDate: "2026-10-21" };
    expect(onEdit).toHaveBeenCalledWith(target);
    expect(onDelete).toHaveBeenCalledWith(target);
  });

  it("leaves Edit and Delete without a handler until one is passed", () => {
    const [item] = groupEventDayItems([row({ canEdit: true })], WINDOW, ctx);
    expect(item.actions?.map((a) => a.onSelect)).toEqual([undefined, undefined]);
  });

  it("names a former member when the creator's account is gone", () => {
    const [item] = groupEventDayItems([row({ createdBy: null })], WINDOW, ctx);
    expect(item.card?.addedBy).toBe("Added by a former member");
    expect(item.card?.locked).toBe("Only a group admin can change this");
  });

  it("says the viewer added their own event", () => {
    const [item] = groupEventDayItems(
      [row({ createdBy: { ...BOB, id: "u-me", name: "Olivia Owner" }, canEdit: true })],
      WINDOW,
      ctx
    );
    expect(item.card?.addedBy).toBe("Added by you");
  });

  it("names the group only in Mine scope", () => {
    const [mine] = groupEventDayItems([row({})], WINDOW, { ...ctx, showGroup: true });
    const [group] = groupEventDayItems([row({})], WINDOW, ctx);
    expect(mine.card?.group).toBe("Dev Team");
    expect(group.card?.group).toBeUndefined();
  });

  it("marks a one-off that changed one date of a recurring event", () => {
    const [item] = groupEventDayItems(
      [row({ recurringEventId: "ge-0", originalDate: "2026-10-20", note: "Room 4" })],
      WINDOW,
      ctx
    );
    expect(item.card?.changedOnce).toBe("Changed for this date only");
    expect(item.card?.note).toBe("Room 4");
  });

  it("lists the events starting on a day before the ones running on from earlier", () => {
    const items = groupEventDayItems(
      [
        row({ id: "a", title: "Offsite", startDate: "2026-10-20", endDate: "2026-10-22" }),
        row({ id: "b", title: "Retro", startTime: "14:00", endTime: "15:00" }),
        row({ id: "c", title: "Party" }),
      ],
      WINDOW,
      ctx
    ).filter((i) => i.date === "2026-10-21");

    expect(items.map((i) => i.title)).toEqual(["Party", "Retro", "Offsite"]);
  });
});
