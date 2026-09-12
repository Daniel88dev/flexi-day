"use client";

import { CalendarDays, ClockAlert, Coffee, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAttendanceState } from "@/lib/api/queries";
import type { AttendanceSession } from "@/lib/api/attendance";
import { formatMinutes } from "@/lib/attendance/duration";
import { buildTimeline, formatClockTime } from "@/lib/attendance/today";
import { useNow } from "@/lib/attendance/use-now";
import { useTranslation } from "@/lib/i18n/use-translation";
import { anySessionLocated } from "@/lib/attendance/location";
import { ClockWidget } from "./clock-widget";
import { DayTotals } from "./day-totals";
import { SessionLocation } from "./session-location";

/** The mockups' flag: one chip, on a break's row or above the session it closed. */
function AutoClosedFlag({ size = "sm" }: { size?: "sm" | "xs" }) {
  const { t } = useTranslation();

  return (
    <span
      className={
        size === "xs"
          ? "flex items-center gap-1 text-xs font-semibold [&_svg]:size-[14px]"
          : "flex items-center gap-1 text-sm font-semibold [&_svg]:size-4"
      }
      style={{ color: "var(--warm)" }}
    >
      <ClockAlert />
      {t.clock.autoClosedFlag}
    </span>
  );
}

function Timeline({ session, now }: { session: AttendanceSession; now: Date }) {
  const { t } = useTranslation();

  return (
    <ul className="flex flex-col">
      {buildTimeline(session, now).map((segment, index) => (
        <li
          key={`${segment.kind}-${segment.startedAt}-${index}`}
          className="flex items-center gap-3 border-b py-2 last:border-b-0"
          style={{ borderColor: "var(--border)" }}
        >
          <span
            className="grid size-7 shrink-0 place-items-center rounded-full [&_svg]:size-[14px]"
            style={{
              background: segment.kind === "break" ? "var(--warm-soft)" : "var(--ok-soft)",
              color: segment.kind === "break" ? "var(--warm)" : "var(--ok)",
            }}
          >
            {segment.kind === "break" ? <Coffee /> : <Play />}
          </span>
          <span className="tabular-nums">
            {formatClockTime(segment.startedAt, session.timezone)}
            {segment.endedAt
              ? ` – ${formatClockTime(segment.endedAt, session.timezone)}`
              : ` – ${t.clock.stillOpen}`}
          </span>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {segment.kind === "break" ? t.clock.breakSegment : t.clock.work}
          </span>
          {segment.autoClosed ? <AutoClosedFlag size="xs" /> : null}
          <span className="ml-auto font-semibold tabular-nums">
            {formatMinutes(segment.minutes)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * My attendance, today only in this ticket: the same clock component the phone's
 * bottom sheet shows, beside the sessions and breaks of the organization's
 * current business date. Worked and required time need rules an employee cannot
 * read yet, so the totals stop at presence and breaks.
 */
export function MyAttendanceScreen() {
  const { t } = useTranslation();
  const query = useAttendanceState();
  const now = useNow(query.data?.openSession != null);

  const state = query.data;
  const sessions = state?.sessions ?? [];
  // An organization that switched location off keeps what it already took, so
  // the strip follows the data as well as the switch.
  const showLocation = (state?.locationEnabled ?? false) || anySessionLocated(sessions);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{t.clock.title}</h1>
        <p style={{ color: "var(--text-muted)" }}>{t.clock.subtitle}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
        <Card>
          <CardContent>
            <ClockWidget showAttendanceLink={false} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 [&_svg]:size-[18px]">
              <CalendarDays />
              {t.clock.today}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {sessions.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {t.clock.emptyDay}
              </p>
            ) : (
              <>
                {sessions.map((session) => (
                  <div key={session.id} className="flex flex-col gap-2">
                    {/* The session's own close. A break the sweep closed is
                        flagged on its own row instead. */}
                    {session.closedBy === "SWEEP" ? <AutoClosedFlag /> : null}
                    <Timeline session={session} now={now} />
                    {showLocation ? <SessionLocation session={session} /> : null}
                  </div>
                ))}
                <DayTotals sessions={sessions} now={now} />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
