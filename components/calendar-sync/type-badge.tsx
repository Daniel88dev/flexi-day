import { VACATION_KIND_LABELS, type VacationKind } from "@/lib/api/types";
import { swatch, TYPE_META } from "@/lib/calendar-sync/meta";

/** A pill showing a record type's icon + label, tinted with its feed color. */
export function TypeBadge({
  type,
  color,
  small,
}: {
  type: VacationKind;
  color?: string; // resolved CSS color; defaults to the type's default swatch
  small?: boolean;
}) {
  const Icon = TYPE_META[type].icon;
  const c = color ?? swatch(TYPE_META[type].def);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-semibold"
      style={{
        fontSize: small ? 11.5 : 12.5,
        padding: small ? "3px 9px 3px 7px" : "4px 11px 4px 8px",
        color: `color-mix(in oklch, ${c} 68%, var(--text))`,
        background: `color-mix(in oklch, ${c} 14%, transparent)`,
        border: `1px solid color-mix(in oklch, ${c} 30%, transparent)`,
      }}
    >
      <Icon size={small ? 12 : 13} style={{ color: c }} />
      {VACATION_KIND_LABELS[type]}
    </span>
  );
}
