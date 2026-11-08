import { describe, expect, it } from "vitest";
import {
  assistantEntry,
  chatGroup,
  createStreamParser,
  weeklyResetLabel,
  type AssistantOrganization,
  type ChatStreamEvent,
} from "../assistant";

const org = (overrides: Partial<AssistantOrganization>): AssistantOrganization => ({
  organizationId: "org",
  organizationName: "Acme",
  eligible: false,
  reason: "TURNED_OFF",
  planAllows: true,
  role: "member",
  weeklyLimit: null,
  ...overrides,
});

describe("assistantEntry", () => {
  it("returns chat with the eligible organizations and the left-out ones", () => {
    const acme = org({ organizationId: "a", eligible: true, reason: null });
    const beta = org({ organizationId: "b", reason: "PLAN", planAllows: false, role: "owner" });
    expect(assistantEntry([acme, beta])).toEqual({
      mode: "chat",
      organizations: [acme],
      leftOut: [beta],
    });
  });

  it("returns the upgrade prompt only for an owner without Enterprise", () => {
    const owned = org({ reason: "PLAN", planAllows: false, role: "owner" });
    expect(assistantEntry([owned])).toEqual({ mode: "upgrade", organization: owned });
    expect(assistantEntry([{ ...owned, role: "admin" }])).toEqual({ mode: "hidden" });
    expect(assistantEntry([{ ...owned, role: "member" }])).toEqual({ mode: "hidden" });
  });

  it("returns the off notice for owners and org admins on Enterprise with the Assistant off", () => {
    const off = org({ reason: "TURNED_OFF", planAllows: true, role: "admin" });
    expect(assistantEntry([off])).toEqual({ mode: "off", organization: off });
    expect(assistantEntry([{ ...off, role: "owner" }])).toEqual({
      mode: "off",
      organization: { ...off, role: "owner" },
    });
    expect(assistantEntry([{ ...off, role: "member" }])).toEqual({ mode: "hidden" });
  });

  it("prefers the off notice to the upgrade prompt", () => {
    const off = org({ organizationId: "a", reason: "TURNED_OFF", role: "owner" });
    const free = org({ organizationId: "b", reason: "PLAN", planAllows: false, role: "owner" });
    expect(assistantEntry([free, off])).toEqual({ mode: "off", organization: off });
  });

  it("returns hidden with no organizations, or while loading", () => {
    expect(assistantEntry([])).toEqual({ mode: "hidden" });
    expect(assistantEntry(undefined)).toEqual({ mode: "hidden" });
  });
});

describe("chatGroup", () => {
  // Wednesday 11 November 2026, 15:00 local time.
  const now = new Date(2026, 10, 11, 15, 0);

  it("returns today for a chat from earlier today", () => {
    expect(chatGroup(new Date(2026, 10, 11, 0, 5).toISOString(), now)).toBe("today");
  });

  it("returns this week from Monday until yesterday", () => {
    expect(chatGroup(new Date(2026, 10, 9, 8, 0).toISOString(), now)).toBe("thisWeek");
    expect(chatGroup(new Date(2026, 10, 10, 23, 59).toISOString(), now)).toBe("thisWeek");
  });

  it("returns earlier before this week's Monday", () => {
    expect(chatGroup(new Date(2026, 10, 8, 23, 59).toISOString(), now)).toBe("earlier");
  });
});

describe("createStreamParser", () => {
  const collect = () => {
    const events: ChatStreamEvent[] = [];
    return { events, parser: createStreamParser((event) => events.push(event)) };
  };

  it("returns each event with its id and data, across chunk boundaries", () => {
    const { events, parser } = collect();
    parser.push('event: text\ndata: {"delta":"Hel');
    parser.push(
      'lo"}\n\nid: sevt_1\nevent: tool\ndata: {"eventId":"sevt_1","name":"x","status":"running"}\n'
    );
    parser.push("\nevent: done\ndata: {}\n\n");
    expect(events).toEqual([
      { event: "text", id: null, data: { delta: "Hello" } },
      { event: "tool", id: "sevt_1", data: { eventId: "sevt_1", name: "x", status: "running" } },
      { event: "done", id: null, data: {} },
    ]);
  });

  it("skips an event it doesn't know", () => {
    const { events, parser } = collect();
    parser.push("event: ping\ndata: {}\n\nevent: done\ndata: {}\n\n");
    expect(events.map((e) => e.event)).toEqual(["done"]);
  });
});

describe("weeklyResetLabel", () => {
  // The suite runs in America/Los_Angeles, eight hours behind UTC in November.
  it("returns Monday 00:00 UTC as the viewer's own weekday, date and time", () => {
    expect(weeklyResetLabel("2026-11-16T00:00:00.000Z", "en-GB")).toBe("Sunday 15 Nov, 16:00");
    expect(weeklyResetLabel("2026-11-16T00:00:00.000Z", "cs-CZ")).toBe("neděle 15. 11. 16:00");
  });
});
