"use client";

import { leaveMetaFor } from "@/lib/demo/leave-meta";
import type { CalendarRecordType } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import { recordTypeLabel } from "@/lib/i18n/record-type-label";

interface LeaveTagProps {
  type: CalendarRecordType;
  small?: boolean;
}

export function LeaveTag({ type, small }: LeaveTagProps) {
  const { t } = useTranslation();
  const meta = leaveMetaFor(type);
  const label = recordTypeLabel(t.calendarRecordTypes, type);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-semibold"
      style={{
        fontSize: small ? 11.5 : 12.5,
        padding: small ? "3px 8px" : "4px 10px",
        color: meta.cssVar,
        background: `color-mix(in oklch, ${meta.cssVar} 14%, transparent)`,
        border: `1px solid color-mix(in oklch, ${meta.cssVar} 26%, transparent)`,
      }}
    >
      <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: meta.cssVar }} />
      {label}
    </span>
  );
}
