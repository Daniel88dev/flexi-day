/** Minutes as `h:mm` — the one time format the attendance screens use. */
export function formatMinutes(minutes: number): string {
  const safe = Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 0;
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

/**
 * Accepts `8:00`, `8:0` and a bare `8` meaning eight hours. Returns null for
 * anything else, so the form refuses the save rather than storing a silent zero.
 */
export function parseMinutes(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;

  const match = /^(\d{1,2})(?::(\d{1,2}))?$/.exec(trimmed);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = match[2] === undefined ? 0 : Number(match[2]);
  if (minutes > 59) return null;

  const total = hours * 60 + minutes;
  return total > 24 * 60 ? null : total;
}

/**
 * A balance: `+0:11`, `-0:25`, `0:00`. Signed and never clamped, unlike
 * {@link formatMinutes}, which formats a length of time and has no negative to
 * show.
 */
export function formatSignedMinutes(minutes: number): string {
  const safe = Number.isFinite(minutes) ? Math.round(minutes) : 0;
  if (safe === 0) return "0:00";
  return `${safe > 0 ? "+" : "-"}${formatMinutes(Math.abs(safe))}`;
}
