import { leaveMetaFor } from "@/lib/demo/leave-meta";
import type { VacationKind } from "@/lib/api/types";

interface LeaveTagProps {
  type: VacationKind;
  small?: boolean;
}

export function LeaveTag({ type, small }: LeaveTagProps) {
  const meta = leaveMetaFor(type);
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
      {meta.label}
    </span>
  );
}
