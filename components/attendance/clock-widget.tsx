"use client";

import Link from "next/link";
import { Clock, Coffee, Lock, LogIn, LogOut, Play, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import type { AttendanceConflictContext } from "@/lib/api/attendance";
import {
  useAttendanceState,
  useClockIn,
  useClockOut,
  useEndBreak,
  useStartBreak,
} from "@/lib/api/queries";
import { formatMinutes } from "@/lib/attendance/duration";
import {
  clockStateOf,
  formatClockTime,
  spanMinutes,
  type ClockState,
} from "@/lib/attendance/today";
import { useNow } from "@/lib/attendance/use-now";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Dictionary } from "@/lib/i18n";
import { DayTotals } from "./day-totals";

/** The icon and colour each running state wears, in the widget and on the disc. */
const FACE = {
  inactive: { Icon: Clock, color: "var(--text-muted)" },
  out: { Icon: Clock, color: "var(--text-muted)" },
  in: { Icon: Play, color: "var(--ok)" },
  break: { Icon: Coffee, color: "var(--warm)" },
} as const satisfies Record<ClockState, { Icon: typeof Clock; color: string }>;

const stateLabel = (status: ClockState, t: Dictionary) =>
  status === "in" ? t.clock.clockedIn : status === "break" ? t.clock.onBreak : t.clock.notClockedIn;

/** The stable `reason` an attendance 409 carries, as something to read. */
function conflictMessage(error: unknown, t: Dictionary): string | null {
  if (!(error instanceof ApiError)) return null;
  const reason = error.context<AttendanceConflictContext>()?.reason;
  if (reason === "NO_OPEN_SESSION") return t.clock.noOpenSession;
  if (reason === "NO_OPEN_BREAK") return t.clock.noOpenBreak;
  if (reason === "BREAK_ALREADY_OPEN") return t.clock.breakAlreadyOpen;
  if (error.status === 402) return t.clock.planLapsed;
  if (error.status === 403) return t.clock.employmentEnded;
  return t.clock.failed;
}

function Notice({
  tone = "muted",
  icon,
  title,
  children,
}: {
  tone?: "muted" | "warn";
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className="flex gap-3 rounded-[var(--radius-sm)] p-3 text-sm"
      style={{ background: tone === "warn" ? "var(--warm-soft)" : "var(--surface-2)" }}
    >
      <span className="mt-0.5 shrink-0 [&_svg]:size-[18px]">{icon}</span>
      <div className="flex flex-col items-start gap-2">
        <div className="flex flex-col gap-1">
          <strong className="font-semibold">{title}</strong>
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * The one clock, in both its homes: the bottom sheet the phone's centre action
 * opens, and the card at the top of My attendance. The big button is always the
 * one thing to do next, and notices stack above it without replacing it —
 * except when attendance is inactive, where there is nothing to press.
 */
export function ClockWidget({
  showAttendanceLink = true,
  onNavigate,
}: {
  /** Off on the My attendance page itself, which is where the link goes. */
  showAttendanceLink?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const query = useAttendanceState();
  const organizationId = query.data?.organizationId ?? null;

  const clockIn = useClockIn(organizationId);
  const clockOut = useClockOut(organizationId);
  const startBreak = useStartBreak(organizationId);
  const endBreak = useEndBreak(organizationId);

  const state = query.data;
  const status = state ? clockStateOf(state) : null;
  const now = useNow(status === "in" || status === "break");

  if (query.isPending) {
    return (
      <p className="py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
        {t.clock.loading}
      </p>
    );
  }

  if (!state || !status) {
    return (
      <p className="py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
        {t.clock.unavailable}
      </p>
    );
  }

  const pending =
    clockIn.isPending || clockOut.isPending || startBreak.isPending || endBreak.isPending;

  // The clock-in that lost to a session opened somewhere else. The state read
  // is refetching, but the widget must not leave a Clock in button under a
  // notice saying there is already one open — the notice carries the action.
  const conflict =
    clockIn.error instanceof ApiError
      ? clockIn.error.context<AttendanceConflictContext>()
      : undefined;
  const openStartedAt =
    conflict?.reason === "SESSION_ALREADY_OPEN" ? conflict.startedAt : undefined;

  const error =
    conflictMessage(clockIn.error, t) ??
    conflictMessage(clockOut.error, t) ??
    conflictMessage(startBreak.error, t) ??
    conflictMessage(endBreak.error, t);

  const attendanceLink = showAttendanceLink ? (
    <Button asChild variant="outline" size="lg" className="w-full">
      <Link href="/my-attendance" onClick={onNavigate}>
        <Timer />
        {t.clock.viewMyAttendance}
      </Link>
    </Button>
  ) : null;

  if (status === "inactive") {
    return (
      <div className="flex flex-col gap-4" data-clock-state="inactive">
        <Notice icon={<Lock />} title={t.clock.inactiveTitle}>
          <p style={{ color: "var(--text-muted)" }}>{t.clock.inactiveBody}</p>
        </Notice>
        {attendanceLink}
      </div>
    );
  }

  const { Icon, color } = FACE[status];
  const running = state.openBreak ?? state.openSession;
  const clockOutAction = (variant: "default" | "secondary") => (
    <Button
      size="lg"
      variant={variant}
      className="w-full"
      disabled={pending}
      onClick={() => clockOut.mutate()}
    >
      <LogOut />
      {t.clock.clockOut}
    </Button>
  );

  return (
    <div className="flex flex-col gap-4" data-clock-state={status}>
      {openStartedAt ? (
        <Notice
          tone="warn"
          icon={<Clock />}
          title={t.clock.alreadyOpen(formatClockTime(openStartedAt, state.timezone))}
        >
          <p style={{ color: "var(--text-muted)" }}>{t.clock.alreadyOpenBody}</p>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => clockOut.mutate()}>
            <LogOut />
            {t.clock.clockOut}
          </Button>
        </Notice>
      ) : null}

      {error && !openStartedAt ? (
        <Notice tone="warn" icon={<Clock />} title={t.clock.failed}>
          <p style={{ color: "var(--text-muted)" }}>{error}</p>
        </Notice>
      ) : null}

      <div className="flex flex-col items-center gap-1">
        <span
          className="flex items-center gap-2 text-sm font-semibold [&_svg]:size-4"
          style={{ color }}
        >
          <Icon />
          {stateLabel(status, t)}
        </span>

        {running ? (
          <>
            <span className="text-5xl font-bold tabular-nums">
              {formatMinutes(spanMinutes(running, now))}
            </span>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t.clock.since(formatClockTime(running.startedAt, state.timezone))}
            </span>
          </>
        ) : (
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {state.sessions.length === 0 ? t.clock.nothingYet : t.clock.today}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        {status === "out" && !openStartedAt ? (
          <Button size="lg" className="w-full" disabled={pending} onClick={() => clockIn.mutate()}>
            <LogIn />
            {clockIn.isPending ? t.clock.working : t.clock.clockIn}
          </Button>
        ) : null}

        {status === "in" ? (
          <>
            <Button
              size="lg"
              variant="secondary"
              className="w-full"
              disabled={pending}
              onClick={() => startBreak.mutate()}
            >
              <Coffee />
              {t.clock.takeBreak}
            </Button>
            {clockOutAction("default")}
          </>
        ) : null}

        {status === "break" ? (
          <>
            <Button
              size="lg"
              className="w-full"
              disabled={pending}
              onClick={() => endBreak.mutate()}
            >
              <Play />
              {t.clock.endBreak}
            </Button>
            {clockOutAction("secondary")}
          </>
        ) : null}
      </div>

      <DayTotals sessions={state.sessions} now={now} />

      {attendanceLink}
    </div>
  );
}
