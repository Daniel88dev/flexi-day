"use client";

import { useState } from "react";
import { Clock, Coffee, LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAttendanceState } from "@/lib/api/queries";
import { formatMinutes } from "@/lib/attendance/duration";
import { clockStateOf, spanMinutes } from "@/lib/attendance/today";
import { useNow } from "@/lib/attendance/use-now";
import { useTranslation } from "@/lib/i18n/use-translation";
import { ClockWidget } from "./clock-widget";

/**
 * The bottom bar's centre action: a disc that carries the clock's state at a
 * glance and opens the widget as a bottom sheet. The slot keeps its place in
 * the five-column grid even when there is nothing to clock, so the tabs either
 * side never shift.
 */
export function ClockSlot() {
  const { t } = useTranslation();
  const query = useAttendanceState();
  const [open, setOpen] = useState(false);

  const state = query.data;
  const status = state ? clockStateOf(state) : null;
  const now = useNow(status === "in" || status === "break");

  if (!state || !status) return <div data-slot="bottom-bar-clock-slot" aria-hidden />;

  const label =
    status === "in" && state.openSession
      ? formatMinutes(spanMinutes(state.openSession, now))
      : status === "break"
        ? t.clock.onBreak
        : t.clock.open;

  const disc =
    status === "in"
      ? { background: "var(--ok)", color: "oklch(0.99 0.01 155)" }
      : status === "break"
        ? { background: "var(--warm)", color: "oklch(0.99 0.01 44)" }
        : status === "inactive"
          ? { background: "var(--surface-2)", color: "var(--text-faint)" }
          : { background: "var(--primary)", color: "var(--primary-fg)" };

  return (
    <>
      <div data-slot="bottom-bar-clock-slot" className="flex justify-center">
        <button
          type="button"
          aria-label={t.clock.open}
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="flex cursor-pointer flex-col items-center gap-1 pt-1.5 text-[11px] font-semibold"
          style={{ color: "var(--text-muted)" }}
        >
          <span
            className="-mt-[30px] grid size-[60px] place-items-center rounded-full [&_svg]:size-[26px]"
            style={{ ...disc, boxShadow: "0 0 0 5px var(--bg), var(--shadow)" }}
          >
            {status === "in" ? <LogOut /> : status === "break" ? <Coffee /> : <Clock />}
          </span>
          <span className="tabular-nums">{label}</span>
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto rounded-t-[28px] border-t-0 px-5 pt-2.5 pb-[max(2rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-lg)]"
          style={{ background: "var(--surface)" }}
        >
          <div
            aria-hidden
            className="mx-auto mb-3 h-1 w-9 rounded-full"
            style={{ background: "var(--border-strong)" }}
          />
          <SheetHeader className="sr-only">
            <SheetTitle>{t.clock.title}</SheetTitle>
            <SheetDescription>{t.clock.subtitle}</SheetDescription>
          </SheetHeader>
          <ClockWidget onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
