import type { ReportScopeMember } from "@/lib/api/report-types";
import { CalendarRecordType } from "@/lib/api/types";

/**
 * CVD-validated categorical palette (fixed order, never re-sorted). Used when a
 * member's avatar color is unparsable or would collide with an already-assigned one.
 */
export const CHART_FALLBACK_COLORS = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#4a3aa7",
  "#e34948",
] as const;

type Hsl = { h: number; s: number; l: number };

function hexToHsl(hex: string): Hsl | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = parseInt(match[1], 16);
  const r = ((value >> 16) & 0xff) / 255;
  const g = ((value >> 8) & 0xff) / 255;
  const b = (value & 0xff) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l: l * 100 };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s: s * 100, l: l * 100 };
}

function parseColor(color: string): Hsl | null {
  const match = /^hsl\(\s*(-?[\d.]+)(?:deg)?\s*[, ]\s*([\d.]+)%\s*[, ]\s*([\d.]+)%\s*\)$/i.exec(
    color.trim()
  );
  if (match) {
    return { h: ((Number(match[1]) % 360) + 360) % 360, s: Number(match[2]), l: Number(match[3]) };
  }
  return hexToHsl(color);
}

/** Similar hue at similar lightness reads as "the same series" in a chart. */
function tooClose(a: Hsl, b: Hsl): boolean {
  const dh = Math.abs(a.h - b.h);
  const hueGap = Math.min(dh, 360 - dh);
  if (a.s < 12 && b.s < 12) return Math.abs(a.l - b.l) < 14;
  return hueGap < 30 && Math.abs(a.l - b.l) < 14;
}

/**
 * Stable per-member chart color. Prefers the member's avatar color so charts
 * match their identity everywhere else in the app; colliding or unparsable
 * colors fall back to the validated categorical palette. Assignment order is
 * alphabetical so the result does not depend on API row order.
 */
export function assignMemberColors(members: ReportScopeMember[]): Record<string, string> {
  const unique = new Map<string, ReportScopeMember>();
  for (const member of members) {
    if (!unique.has(member.id)) unique.set(member.id, member);
  }
  const ordered = Array.from(unique.values()).sort(
    (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)
  );

  const taken: Hsl[] = [];
  const usedFallbacks = new Set<string>();
  const collides = (candidate: Hsl | null) =>
    candidate !== null && taken.some((existing) => tooClose(existing, candidate));

  const colors: Record<string, string> = {};
  for (const member of ordered) {
    const avatar = parseColor(member.avatarColor);
    let color: string;
    let hsl: Hsl | null;

    if (avatar && !collides(avatar)) {
      color = member.avatarColor;
      hsl = avatar;
    } else {
      color =
        CHART_FALLBACK_COLORS.find((c) => !usedFallbacks.has(c) && !collides(hexToHsl(c))) ??
        CHART_FALLBACK_COLORS.find((c) => !usedFallbacks.has(c)) ??
        CHART_FALLBACK_COLORS[Object.keys(colors).length % CHART_FALLBACK_COLORS.length];
      usedFallbacks.add(color);
      hsl = hexToHsl(color);
    }

    if (hsl) taken.push(hsl);
    colors[member.id] = color;
  }

  return colors;
}

/**
 * Chart fill per leave type, reusing the palette the calendar and dashboard
 * already tint with so a vacation bar is the same purple everywhere.
 */
export const CALENDAR_RECORD_TYPE_CHART_COLORS: Record<CalendarRecordType, string> = {
  [CalendarRecordType.Vacation]: "var(--c-vacation)",
  [CalendarRecordType.HomeOffice]: "var(--c-home)",
  [CalendarRecordType.Sick]: "var(--c-sick)",
  [CalendarRecordType.SickDay]: "var(--c-sick)",
  [CalendarRecordType.BankHoliday]: "var(--c-bank)",
  [CalendarRecordType.NonPaidLeave]: "var(--c-bank)",
  [CalendarRecordType.PaidTimeOff]: "var(--c-pto)",
  [CalendarRecordType.StudyLeave]: "var(--c-pto)",
  [CalendarRecordType.Other]: "var(--muted-foreground)",
};
