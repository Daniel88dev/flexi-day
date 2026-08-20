type Rgb = { r: number; g: number; b: number }; // channels 0..1

function hexToRgb(color: string): Rgb | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!match) return null;
  let hex = match[1];
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const value = parseInt(hex, 16);
  return {
    r: ((value >> 16) & 0xff) / 255,
    g: ((value >> 8) & 0xff) / 255,
    b: (value & 0xff) / 255,
  };
}

function hslToRgb(color: string): Rgb | null {
  const match = /^hsl\(\s*(-?[\d.]+)(?:deg)?\s*[, ]\s*([\d.]+)%\s*[, ]\s*([\d.]+)%\s*\)$/i.exec(
    color.trim()
  );
  if (!match) return null;
  const h = (((Number(match[1]) % 360) + 360) % 360) / 360;
  const s = Math.min(100, Number(match[2])) / 100;
  const l = Math.min(100, Number(match[3])) / 100;
  if (s === 0) return { r: l, g: l, b: l };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return { r: channel(h + 1 / 3), g: channel(h), b: channel(h - 1 / 3) };
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

const DARK = "#111827";
const DARK_LUMINANCE = 0.0092;

/**
 * Foreground color readable on the given background (`hsl(...)`, hex, or a
 * gradient — judged by its first color stop). Picks whichever of white and
 * near-black has the higher WCAG contrast; unparsable input keeps white.
 */
export function readableForeground(background: string): string {
  const token =
    /#(?:[0-9a-f]{6}|[0-9a-f]{3})\b|hsl\([^)]*\)/i.exec(background)?.[0] ?? background;
  const rgb = hslToRgb(token) ?? hexToRgb(token);
  if (!rgb) return "#fff";
  const lum = relativeLuminance(rgb);
  if (Number.isNaN(lum)) return "#fff";
  const whiteContrast = 1.05 / (lum + 0.05);
  const darkContrast = (lum + 0.05) / (DARK_LUMINANCE + 0.05);
  return whiteContrast >= darkContrast ? "#fff" : DARK;
}
