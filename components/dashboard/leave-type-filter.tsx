"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_LEAVE_TYPES, leaveMetaFor, type LeaveTypeKey } from "@/lib/demo/leave-meta";
import { useTranslation } from "@/lib/i18n/use-translation";

interface LeaveTypeFilterProps {
  value: Set<LeaveTypeKey>;
  onChange: (next: Set<LeaveTypeKey>) => void;
}

/**
 * Leave-type filter. Chips on desktop; on phones the same five chips wrap to
 * two rows and push the calendar off screen, so they collapse into a
 * multi-select menu.
 */
export function LeaveTypeFilter({ value, onChange }: LeaveTypeFilterProps) {
  const { t } = useTranslation();

  function toggle(id: LeaveTypeKey) {
    const next = new Set(value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  const allSelected = value.size === DEFAULT_LEAVE_TYPES.length;
  const summary = allSelected
    ? t.dashboard.filter.allTypes
    : value.size === 0
      ? t.dashboard.filter.noTypes
      : t.dashboard.filter.someTypes(value.size);

  return (
    <>
      <div className="hidden flex-wrap gap-2 sm:flex">
        {DEFAULT_LEAVE_TYPES.map((id) => {
          const meta = leaveMetaFor(id);
          const on = value.has(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(id)}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-[5px] text-[12.5px] font-semibold transition-all"
              style={{
                borderColor: on
                  ? `color-mix(in oklch, ${meta.cssVar} 32%, transparent)`
                  : "var(--border)",
                background: on
                  ? `color-mix(in oklch, ${meta.cssVar} 12%, transparent)`
                  : "transparent",
                color: on ? meta.cssVar : "var(--text-faint)",
                opacity: on ? 1 : 0.6,
              }}
            >
              <span
                className="h-[7px] w-[7px] rounded-full"
                style={{ background: on ? meta.cssVar : "var(--text-faint)" }}
              />
              {t.leaveTypes[id].label}
            </button>
          );
        })}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center gap-2 rounded-full border px-3 py-[6px] text-[12.5px] font-semibold sm:hidden"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border-strong)",
            color: "var(--text)",
          }}
          aria-label={t.dashboard.filter.label}
        >
          <span className="flex items-center -space-x-1">
            {DEFAULT_LEAVE_TYPES.filter((id) => value.has(id)).map((id) => (
              <span
                key={id}
                className="h-[9px] w-[9px] rounded-full"
                style={{
                  background: leaveMetaFor(id).cssVar,
                  outline: "1.5px solid var(--surface)",
                }}
              />
            ))}
          </span>
          {summary}
          <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--text-faint)" }} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" collisionPadding={16} className="w-52">
          {DEFAULT_LEAVE_TYPES.map((id) => {
            const meta = leaveMetaFor(id);
            const on = value.has(id);
            return (
              <DropdownMenuCheckboxItem
                key={id}
                checked={on}
                // Without this the menu closes after every tick.
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={() => toggle(id)}
              >
                <span
                  className="h-[9px] w-[9px] shrink-0 rounded-full"
                  style={{ background: meta.cssVar, opacity: on ? 1 : 0.45 }}
                />
                {t.leaveTypes[id].label}
              </DropdownMenuCheckboxItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              onChange(new Set(allSelected ? [] : DEFAULT_LEAVE_TYPES));
            }}
          >
            {allSelected ? t.dashboard.filter.clearAll : t.dashboard.filter.selectAll}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
