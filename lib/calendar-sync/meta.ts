import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CircleDashed,
  GraduationCap,
  HeartPulse,
  House,
  Plane,
  Star,
  Thermometer,
  Wallet,
} from "lucide-react";
import { VacationKind } from "@/lib/api/types";
import type {
  CalendarSyncConfig,
  CalendarSyncInput,
  CalendarSyncScope,
} from "@/lib/api/calendar-sync";

/**
 * Accessible swatch palette — keys mirror the backend `CALENDAR_SYNC_PALETTE`.
 * Colors are always paired with a label + icon so we never rely on hue alone.
 */
export const PALETTE = [
  { key: "violet", name: "Violet", css: "oklch(0.58 0.16 285)" },
  { key: "indigo", name: "Indigo", css: "oklch(0.56 0.14 262)" },
  { key: "blue", name: "Blue", css: "oklch(0.58 0.13 232)" },
  { key: "teal", name: "Teal", css: "oklch(0.56 0.10 190)" },
  { key: "green", name: "Green", css: "oklch(0.57 0.13 155)" },
  { key: "amber", name: "Amber", css: "oklch(0.66 0.13 70)" },
  { key: "coral", name: "Coral", css: "oklch(0.62 0.15 40)" },
  { key: "rose", name: "Rose", css: "oklch(0.58 0.16 15)" },
  { key: "plum", name: "Plum", css: "oklch(0.54 0.15 320)" },
  { key: "slate", name: "Slate", css: "oklch(0.55 0.03 265)" },
] as const;

export type SwatchKey = (typeof PALETTE)[number]["key"];

const PALETTE_BY_KEY: Record<string, (typeof PALETTE)[number]> = Object.fromEntries(
  PALETTE.map((p) => [p.key, p])
);

/** Resolve a swatch key to its CSS color, falling back to the first swatch. */
export const swatch = (key: string): string => (PALETTE_BY_KEY[key] ?? PALETTE[0]).css;

/** Per-type icon + default swatch. Extensible: every {@link VacationKind} maps here. */
export const TYPE_META: Record<VacationKind, { icon: LucideIcon; def: SwatchKey }> = {
  [VacationKind.Vacation]: { icon: Plane, def: "violet" },
  [VacationKind.HomeOffice]: { icon: House, def: "green" },
  [VacationKind.Sick]: { icon: HeartPulse, def: "coral" },
  [VacationKind.BankHoliday]: { icon: Star, def: "amber" },
  [VacationKind.PaidTimeOff]: { icon: CalendarDays, def: "blue" },
  [VacationKind.SickLeave]: { icon: Thermometer, def: "rose" },
  [VacationKind.StudyLeave]: { icon: GraduationCap, def: "indigo" },
  [VacationKind.NonPaidLeave]: { icon: Wallet, def: "slate" },
  [VacationKind.Other]: { icon: CircleDashed, def: "teal" },
};

/** Display order of record types in the builder. */
export const TYPE_ORDER: VacationKind[] = [
  VacationKind.Vacation,
  VacationKind.HomeOffice,
  VacationKind.PaidTimeOff,
  VacationKind.Sick,
  VacationKind.SickLeave,
  VacationKind.BankHoliday,
  VacationKind.StudyLeave,
  VacationKind.NonPaidLeave,
  VacationKind.Other,
];

/** Distinct default swatches for the owner's own records when `distinguishMine`. */
const MINE_DEFAULTS: Partial<Record<VacationKind, SwatchKey>> = {
  [VacationKind.Vacation]: "plum",
  [VacationKind.PaidTimeOff]: "teal",
  [VacationKind.HomeOffice]: "indigo",
};

const mineKey = (type: VacationKind) => `${type}_mine`;

/** The builder's working config — a superset of the API shape, editable in place. */
export type BuilderConfig = {
  id: string | null; // null for a not-yet-saved config
  name: string;
  scope: CalendarSyncScope;
  teamIds: string[];
  distinguishMine: boolean;
  types: VacationKind[];
  colors: Record<string, SwatchKey>; // keyed by `${type}` and `${type}_mine`
  feedUrl: string | null;
  tokenMasked: boolean;
};

/** Full color map seeded from defaults, including the `*_mine` variants. */
export function defaultColors(): Record<string, SwatchKey> {
  const colors: Record<string, SwatchKey> = {};
  for (const type of TYPE_ORDER) {
    colors[type] = TYPE_META[type].def;
    colors[mineKey(type)] = MINE_DEFAULTS[type] ?? TYPE_META[type].def;
  }
  return colors;
}

/** A fresh builder config for the "New calendar" flow. */
export function newBuilderConfig(defaultTeamIds: string[] = []): BuilderConfig {
  return {
    id: null,
    name: "",
    scope: "ME",
    teamIds: defaultTeamIds.slice(0, 1),
    distinguishMine: false,
    types: [VacationKind.Vacation, VacationKind.PaidTimeOff, VacationKind.Sick],
    colors: defaultColors(),
    feedUrl: null,
    tokenMasked: false,
  };
}

/** Hydrate a builder config from an API config (edit flow). */
export function configToBuilder(cfg: CalendarSyncConfig): BuilderConfig {
  const colors = defaultColors();
  for (const t of cfg.types) {
    if (isSwatchKey(t.color)) colors[t.type] = t.color;
    if (t.mineColor && isSwatchKey(t.mineColor)) colors[mineKey(t.type)] = t.mineColor;
  }
  return {
    id: cfg.id,
    name: cfg.name,
    scope: cfg.scope,
    teamIds: [...cfg.teamIds],
    distinguishMine: cfg.distinguishMine,
    types: cfg.types.map((t) => t.type),
    colors,
    feedUrl: cfg.tokenMasked ? null : cfg.feedUrl,
    tokenMasked: cfg.tokenMasked,
  };
}

/** Build the API request body from a builder config. */
export function builderToInput(cfg: BuilderConfig): CalendarSyncInput {
  const sendMine = cfg.distinguishMine;
  return {
    name: cfg.name.trim(),
    scope: cfg.scope,
    distinguishMine: cfg.distinguishMine,
    teamIds: cfg.teamIds,
    types: cfg.types.map((type) => ({
      type,
      color: cfg.colors[type] ?? TYPE_META[type].def,
      ...(sendMine ? { mineColor: cfg.colors[mineKey(type)] ?? TYPE_META[type].def } : {}),
    })),
  };
}

/** Resolve the CSS color for an entry, honouring the "distinguish mine" split. */
export function colorFor(
  cfg: Pick<BuilderConfig, "distinguishMine" | "scope" | "colors">,
  type: VacationKind,
  isMine: boolean
): string {
  if (cfg.distinguishMine && cfg.scope === "TEAM" && isMine && cfg.colors[mineKey(type)]) {
    return swatch(cfg.colors[mineKey(type)]);
  }
  return swatch(cfg.colors[type] ?? TYPE_META[type].def);
}

function isSwatchKey(v: string): v is SwatchKey {
  return v in PALETTE_BY_KEY;
}

/** Masks the secret token inside a full feed URL for a hidden-by-default display. */
export function maskFeedUrl(feedUrl: string): string {
  return feedUrl.replace(
    /\/calendars\/([^/]+)\.ics$/,
    (_m, token: string) => `/calendars/${token.slice(0, 9)}${"•".repeat(18)}.ics`
  );
}
