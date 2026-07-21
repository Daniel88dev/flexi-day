import { describe, expect, it } from "vitest";
import { VacationKind } from "@/lib/api/types";
import type { CalendarSyncConfig } from "@/lib/api/calendar-sync";
import {
  builderToInput,
  colorFor,
  configToBuilder,
  defaultColors,
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
  it("covers every vacation kind", () => {
    for (const kind of Object.values(VacationKind)) {
      expect(TYPE_META[kind]).toBeDefined();
      expect(TYPE_ORDER).toContain(kind);
    }
    expect(TYPE_ORDER).toHaveLength(Object.values(VacationKind).length);
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
    const cfg = { ...base, colors: { ...base.colors, [`${VacationKind.Vacation}_mine`]: "rose" } };
    expect(colorFor(cfg, VacationKind.Vacation, true)).toBe(swatch("rose"));
  });
  it("uses the base color for others", () => {
    const cfg = { ...base, colors: { ...base.colors, [VacationKind.Vacation]: "blue" } };
    expect(colorFor(cfg, VacationKind.Vacation, false)).toBe(swatch("blue"));
  });
  it("ignores the mine color when not distinguishing", () => {
    const cfg = { distinguishMine: false, scope: "TEAM" as const, colors: base.colors };
    expect(colorFor(cfg, VacationKind.Vacation, true)).toBe(swatch(base.colors[VacationKind.Vacation]));
  });
  it("ignores the mine color in ME scope", () => {
    const cfg = { distinguishMine: true, scope: "ME" as const, colors: base.colors };
    expect(colorFor(cfg, VacationKind.Vacation, true)).toBe(swatch(base.colors[VacationKind.Vacation]));
  });
});

describe("builderToInput", () => {
  it("trims the name and maps included types to color entries", () => {
    const cfg = newBuilderConfig();
    cfg.name = "  My feed  ";
    cfg.types = [VacationKind.Vacation, VacationKind.Sick];
    cfg.colors = { ...cfg.colors, [VacationKind.Vacation]: "rose", [VacationKind.Sick]: "teal" };
    const input = builderToInput(cfg);
    expect(input.name).toBe("My feed");
    expect(input.types).toEqual([
      { type: VacationKind.Vacation, color: "rose" },
      { type: VacationKind.Sick, color: "teal" },
    ]);
  });

  it("includes mineColor only when distinguishMine is on", () => {
    const cfg = newBuilderConfig();
    cfg.types = [VacationKind.Vacation];
    cfg.distinguishMine = true;
    cfg.colors = { ...cfg.colors, [`${VacationKind.Vacation}_mine`]: "plum" };
    expect(builderToInput(cfg).types[0]).toEqual({
      type: VacationKind.Vacation,
      color: cfg.colors[VacationKind.Vacation],
      mineColor: "plum",
    });
  });
});

describe("configToBuilder", () => {
  it("round-trips an API config into an editable builder config", () => {
    const api: CalendarSyncConfig = {
      id: "cfg-1",
      name: "Design team",
      scope: "TEAM",
      distinguishMine: true,
      teamIds: ["t1", "t2"],
      types: [
        { type: VacationKind.Vacation, label: "Vacation", color: "rose", mineColor: "violet" },
        { type: VacationKind.PaidTimeOff, label: "Paid time off", color: "blue", mineColor: null },
      ],
      feedUrl: "https://api.flexiday.app/calendars/abc.ics",
      tokenMasked: false,
      lastFetchedAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const b = configToBuilder(api);
    expect(b.id).toBe("cfg-1");
    expect(b.scope).toBe("TEAM");
    expect(b.teamIds).toEqual(["t1", "t2"]);
    expect(b.types).toEqual([VacationKind.Vacation, VacationKind.PaidTimeOff]);
    expect(b.colors[VacationKind.Vacation]).toBe("rose");
    expect(b.colors[`${VacationKind.Vacation}_mine`]).toBe("violet");
    expect(b.feedUrl).toBe(api.feedUrl);
  });

  it("hides the feed URL when the token is masked", () => {
    const api = {
      id: "x",
      name: "n",
      scope: "ME",
      distinguishMine: false,
      teamIds: [],
      types: [{ type: VacationKind.Vacation, label: "Vacation", color: "violet", mineColor: null }],
      feedUrl: "https://api.flexiday.app/calendars/abc123456••••.ics",
      tokenMasked: true,
      lastFetchedAt: null,
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
