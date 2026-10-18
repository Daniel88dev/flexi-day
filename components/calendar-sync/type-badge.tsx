"use client";

import type { LucideIcon } from "lucide-react";
import { type CalendarRecordType } from "@/lib/api/types";
import { BIRTHDAYS_META, GROUP_EVENTS_META, swatch, typeMetaFor } from "@/lib/calendar-sync/meta";
import { useTranslation } from "@/lib/i18n/use-translation";
import { recordTypeLabel } from "@/lib/i18n/record-type-label";

function Pill({
  icon: Icon,
  label,
  color,
  small,
}: {
  icon: LucideIcon;
  label: string;
  color: string;
  small?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-semibold"
      style={{
        fontSize: small ? 11.5 : 12.5,
        padding: small ? "3px 9px 3px 7px" : "4px 11px 4px 8px",
        color: `color-mix(in oklch, ${color} 68%, var(--text))`,
        background: `color-mix(in oklch, ${color} 14%, transparent)`,
        border: `1px solid color-mix(in oklch, ${color} 30%, transparent)`,
      }}
    >
      <Icon size={small ? 12 : 13} style={{ color }} />
      {label}
    </span>
  );
}

/** A pill showing a record type's icon + label, tinted with its feed color. */
export function TypeBadge({
  type,
  color,
  small,
}: {
  type: CalendarRecordType;
  color?: string; // resolved CSS color; defaults to the type's default swatch
  small?: boolean;
}) {
  const { t } = useTranslation();
  const meta = typeMetaFor(type);
  return (
    <Pill
      icon={meta.icon}
      label={recordTypeLabel(t.calendarRecordTypes, type)}
      color={color ?? swatch(meta.def)}
      small={small}
    />
  );
}

/** The same pill for a feed's Group events row. */
export function GroupEventsBadge({ color, small }: { color: string | null; small?: boolean }) {
  const { t } = useTranslation();
  return (
    <Pill
      icon={GROUP_EVENTS_META.icon}
      label={t.calSync.builder.groupEvents}
      color={swatch(color ?? GROUP_EVENTS_META.def)}
      small={small}
    />
  );
}

/** The same pill for a feed's Birthdays row. */
export function BirthdaysBadge({ color, small }: { color: string | null; small?: boolean }) {
  const { t } = useTranslation();
  return (
    <Pill
      icon={BIRTHDAYS_META.icon}
      label={t.calSync.builder.birthdays}
      color={swatch(color ?? BIRTHDAYS_META.def)}
      small={small}
    />
  );
}
