import { describe, expect, it } from "vitest";
import { CalendarRecordType } from "@/lib/api/types";
import type { CalendarSyncConfig } from "@/lib/api/calendar-sync";
import type { SwatchKey } from "../meta";
import {
  builderToInput,
  carriesSomething,
  colorFor,
  configToBuilder,
  defaultColors,
  liveTeamIds,
  maskFeedUrl,
  newBuilderConfig,
  PALETTE,
  swatch,
  TYPE_META,
  TYPE_ORDER,
} from "../meta";

describe("swatch", () => {
  it("returns the CSS for a known key", () => {
    expect(swatch("violet")).toBe(PALETTE[0].css);
  });
  it("falls back to the first swatch for an unknown key", () => {
    expect(swatch("nope")).toBe(PALETTE[0].css);
  });
});

describe("TYPE_META / TYPE_ORDER", () => {
  it("covers every calendar record type", () => {
    for (const kind of Object.values(CalendarRecordType)) {
      expect(TYPE_META[kind]).toBeDefined();
      expect(TYPE_ORDER).toContain(kind);
    }
    expect(TYPE_ORDER).toHaveLength(Object.values(CalendarRecordType).length);
  });
});

describe("defaultColors", () => {
  it("seeds a base + mine color for each type", () => {
    const colors = defaultColors();
    for (const type of TYPE_ORDER) {
      expect(colors[type]).toBe(TYPE_META[type].def);
      expect(colors[`${type}_mine`]).toBeTruthy();
    }
  });
});

describe("newBuilderConfig", () => {
  it("defaults to ME scope with at most one seeded team", () => {
    const cfg = newBuilderConfig(["a", "b", "c"]);
    expect(cfg.id).toBeNull();
    expect(cfg.scope).toBe("ME");
    expect(cfg.teamIds).toEqual(["a"]);
    expect(cfg.types.length).toBeGreaterThan(0);
  });
});

describe("colorFor", () => {
  const base = { distinguishMine: true, scope: "TEAM" as const, colors: defaultColors() };

  it("uses the mine color for the owner when distinguishing in TEAM scope", () => {
    const colors: Record<string, SwatchKey> = {
      ...base.colors,
      [`${CalendarRecordType.Vacation}_mine`]: "rose",
    };
    expect(colorFor({ ...base, colors }, CalendarRecordType.Vacation, true)).toBe(swatch("rose"));
  });
  it("uses the base color for others", () => {
    const colors: Record<string, SwatchKey> = {
      ...base.colors,
      [CalendarRecordType.Vacation]: "blue",
    };
    const cfg = { ...base, colors };
    expect(colorFor(cfg, CalendarRecordType.Vacation, false)).toBe(swatch("blue"));
  });
  it("ignores the mine color when not distinguishing", () => {
    const cfg = { distinguishMine: false, scope: "TEAM" as const, colors: base.colors };
    expect(colorFor(cfg, CalendarRecordType.Vacation, true)).toBe(
      swatch(base.colors[CalendarRecordType.Vacation])
    );
  });
  it("ignores the mine color in ME scope", () => {
    const cfg = { distinguishMine: true, scope: "ME" as const, colors: base.colors };
    expect(colorFor(cfg, CalendarRecordType.Vacation, true)).toBe(
      swatch(base.colors[CalendarRecordType.Vacation])
    );
  });
});

describe("builderToInput", () => {
  it("trims the name and maps included types to color entries", () => {
    const cfg = newBuilderConfig();
    cfg.name = "  My feed  ";
    cfg.types = [CalendarRecordType.Vacation, CalendarRecordType.Sick];
    cfg.colors = {
      ...cfg.colors,
      [CalendarRecordType.Vacation]: "rose",
      [CalendarRecordType.Sick]: "teal",
    };
    const input = builderToInput(cfg);
    expect(input.name).toBe("My feed");
    expect(input.types).toEqual([
      { type: CalendarRecordType.Vacation, color: "rose" },
      { type: CalendarRecordType.Sick, color: "teal" },
    ]);
  });

  it("includes mineColor only when distinguishMine is on", () => {
    const cfg = newBuilderConfig();
    cfg.types = [CalendarRecordType.Vacation];
    cfg.distinguishMine = true;
    cfg.colors = { ...cfg.colors, [`${CalendarRecordType.Vacation}_mine`]: "plum" };
    expect(builderToInput(cfg).types[0]).toEqual({
      type: CalendarRecordType.Vacation,
      color: cfg.colors[CalendarRecordType.Vacation],
      mineColor: "plum",
    });
  });
});

describe("the Group events row", () => {
  it("is off with the teal swatch on a new config", () => {
    expect(newBuilderConfig()).toMatchObject({
      includeGroupEvents: false,
      groupEventsColor: "teal",
    });
  });

  it("goes into the request body and carries a feed on its own", () => {
    const cfg = {
      ...newBuilderConfig(),
      types: [],
      includeGroupEvents: true,
      groupEventsColor: "plum" as const,
    };
    expect(builderToInput(cfg)).toMatchObject({
      types: [],
      includeGroupEvents: true,
      groupEventsColor: "plum",
    });
    expect(carriesSomething(cfg)).toBe(true);
    expect(carriesSomething({ ...cfg, includeGroupEvents: false })).toBe(false);
  });

  it("comes back from a stored config, its colour falling back to teal", () => {
    const api = {
      id: "x",
      name: "n",
      scope: "ME",
      distinguishMine: false,
      timeZone: "Europe/Prague",
      includeGroupEvents: true,
      groupEventsColor: null,
      includeBirthdays: false,
      birthdaysColor: null,
      teamIds: [],
      types: [],
      feedUrl: "https://api.flexiday.app/calendars/abc.ics",
      tokenMasked: false,
      lastFetchedAt: null,
      target: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } satisfies CalendarSyncConfig;
    expect(configToBuilder(api)).toMatchObject({
      includeGroupEvents: true,
      groupEventsColor: "teal",
    });
    expect(configToBuilder({ ...api, groupEventsColor: "rose" }).groupEventsColor).toBe("rose");
  });
});

describe("the Birthdays row", () => {
  it("is off with the coral swatch on a new config", () => {
    expect(newBuilderConfig()).toMatchObject({ includeBirthdays: false, birthdaysColor: "coral" });
  });

  it("goes into the request body, with or without record types", () => {
    const cfg = { ...newBuilderConfig(), types: [], includeBirthdays: true };
    cfg.birthdaysColor = "rose";
    expect(builderToInput(cfg)).toMatchObject({
      types: [],
      includeBirthdays: true,
      birthdaysColor: "rose",
    });
    expect(carriesSomething(cfg)).toBe(true);
    expect(carriesSomething({ ...cfg, includeBirthdays: false })).toBe(false);
  });

  it("comes back from a stored config, its colour falling back to coral", () => {
    const api = {
      id: "x",
      name: "n",
      scope: "ME",
      distinguishMine: false,
      timeZone: "Europe/Prague",
      includeGroupEvents: false,
      groupEventsColor: null,
      includeBirthdays: true,
      birthdaysColor: null,
      teamIds: [],
      types: [],
      feedUrl: "https://api.flexiday.app/calendars/abc.ics",
      tokenMasked: false,
      lastFetchedAt: null,
      target: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } satisfies CalendarSyncConfig;
    expect(configToBuilder(api)).toMatchObject({ includeBirthdays: true, birthdaysColor: "coral" });
    expect(configToBuilder({ ...api, birthdaysColor: "plum" }).birthdaysColor).toBe("plum");
  });
});

describe("configToBuilder", () => {
  it("round-trips an API config into an editable builder config", () => {
    const api: CalendarSyncConfig = {
      id: "cfg-1",
      name: "Design team",
      scope: "TEAM",
      distinguishMine: true,
      timeZone: "Europe/Prague",
      includeGroupEvents: false,
      groupEventsColor: null,
      includeBirthdays: false,
      birthdaysColor: null,
      teamIds: ["t1", "t2"],
      types: [
        {
          type: CalendarRecordType.Vacation,
          label: "Vacation",
          color: "rose",
          mineColor: "violet",
        },
        {
          type: CalendarRecordType.PaidTimeOff,
          label: "Paid time off",
          color: "blue",
          mineColor: null,
        },
      ],
      feedUrl: "https://api.flexiday.app/calendars/abc.ics",
      tokenMasked: false,
      lastFetchedAt: null,
      target: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const b = configToBuilder(api);
    expect(b.id).toBe("cfg-1");
    expect(b.scope).toBe("TEAM");
    expect(b.teamIds).toEqual(["t1", "t2"]);
    expect(b.types).toEqual([CalendarRecordType.Vacation, CalendarRecordType.PaidTimeOff]);
    expect(b.colors[CalendarRecordType.Vacation]).toBe("rose");
    expect(b.colors[`${CalendarRecordType.Vacation}_mine`]).toBe("violet");
    expect(b.feedUrl).toBe(api.feedUrl);
  });

  it("hides the feed URL when the token is masked", () => {
    const api = {
      id: "x",
      name: "n",
      scope: "ME",
      distinguishMine: false,
      timeZone: "Europe/Prague",
      includeGroupEvents: false,
      groupEventsColor: null,
      includeBirthdays: false,
      birthdaysColor: null,
      teamIds: [],
      types: [
        { type: CalendarRecordType.Vacation, label: "Vacation", color: "violet", mineColor: null },
      ],
      feedUrl: "https://api.flexiday.app/calendars/abc123456••••.ics",
      tokenMasked: true,
      lastFetchedAt: null,
      target: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } satisfies CalendarSyncConfig;
    expect(configToBuilder(api).feedUrl).toBeNull();
  });
});

describe("maskFeedUrl", () => {
  it("masks the token segment while keeping the host and extension", () => {
    const masked = maskFeedUrl("https://api.flexiday.app/calendars/flx_live_0123456789abcdef.ics");
    expect(masked).toContain("https://api.flexiday.app/calendars/flx_live_");
    expect(masked).toContain("•");
    expect(masked.endsWith(".ics")).toBe(true);
    expect(masked).not.toContain("0123456789abcdef");
  });
});

describe("liveTeamIds", () => {
  it("returns only the stored ids the user is still a member of, in stored order", () => {
    expect(liveTeamIds(["b", "left", "a"], [{ id: "a" }, { id: "b" }])).toEqual(["b", "a"]);
  });

  it("returns an empty list when the user is in none of the stored groups", () => {
    expect(liveTeamIds(["left"], [{ id: "a" }])).toEqual([]);
  });
});
