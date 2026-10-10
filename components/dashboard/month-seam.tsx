import type { ReactNode } from "react";
import type { IsoDate } from "@/lib/api/types";
import { formatIsoDate } from "@/lib/calendar/month-grid";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

/** Lighter than a weekend number, which already uses `--text-faint`. */
export const ADJACENT_DAY_COLOR = "color-mix(in oklch, var(--text-faint) 70%, transparent)";

export const ADJACENT_DAY_TINT = "color-mix(in oklch, var(--surface-2) 50%, transparent)";

const WEEKEND_TINT = "color-mix(in oklch, var(--surface-2) 45%, transparent)";

export function dayNumberColor({
  isToday,
  isSelected = false,
  inMonth,
  isWeekend,
}: {
  isToday: boolean;
  isSelected?: boolean;
  inMonth: boolean;
  isWeekend: boolean;
}): string {
  if (isToday) return "var(--primary-fg)";
  if (isSelected) return "var(--surface)";
  if (!inMonth) return ADJACENT_DAY_COLOR;
  return isWeekend ? "var(--text-faint)" : "var(--text-muted)";
}

export function dayTint({
  inMonth,
  isWeekend,
}: {
  inMonth: boolean;
  isWeekend: boolean;
}): string | undefined {
  if (!inMonth) return ADJACENT_DAY_TINT;
  return isWeekend ? WEEKEND_TINT : undefined;
}

export function MonthSeam({ col }: { col: number }) {
  return (
    <div
      aria-hidden
      data-testid="month-seam"
      data-col={col}
      className="pointer-events-none absolute inset-y-0 w-0.5"
      style={{
        left: `calc(${(col / 7) * 100}% - 1px)`,
        background: "var(--text-faint)",
        opacity: 0.55,
      }}
    />
  );
}

/**
 * A day number, followed by the short month name when `labelDate` is set. Its cell must be an
 * `@container`: below 60px the month name moves to a caption line above the number, so it never
 * spills into the next cell.
 */
export function DayHeading({
  labelDate,
  className,
  children,
}: {
  labelDate: IsoDate | null;
  className?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "flex w-fit flex-col-reverse items-start @min-[60px]:flex-row @min-[60px]:items-center @min-[60px]:gap-1",
        className
      )}
    >
      {children}
      {labelDate ? (
        <span
          className="pl-1 text-[9px] leading-none font-semibold tracking-[.03em] whitespace-nowrap uppercase @min-[60px]:pl-0 @min-[60px]:text-[11px] @min-[60px]:leading-normal"
          style={{ color: "var(--text-faint)" }}
        >
          {formatIsoDate(labelDate, t.common.dateLocale, { month: "short" })}
        </span>
      ) : null}
    </span>
  );
}
