"use client";

import { useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClockAlert,
  Coffee,
  Lock,
  Pencil,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAttendanceDay, useAttendanceMonth, useAttendanceState } from "@/lib/api/queries";
import type { AttendanceSession } from "@/lib/api/attendance";
import { formatMinutes } from "@/lib/attendance/duration";
import {
  addDays,
  monthsOfWeek,
  pickDays,
  startOfWeek,
  weekDates,
  yearMonthOf,
} from "@/lib/attendance/month";
import { stepAnchor } from "@/lib/attendance/team";
import {
  selfServiceMode,
  selfServiceVerdict,
  type SelfServiceVerdict,
  type SelfServiceWindow,
} from "@/lib/attendance/self-service";
import { buildTimeline, formatBusinessDay, formatClockTime } from "@/lib/attendance/today";
import { useNow } from "@/lib/attendance/use-now";
import { useTranslation } from "@/lib/i18n/use-translation";
import { anySessionLocated } from "@/lib/attendance/location";
import { cn } from "@/lib/utils";
import { ClockWidget } from "./clock-widget";
import { CorrectionDialog } from "./correction-dialog";
import { DayTotals } from "./day-totals";
import { MonthView } from "./month-view";
import { SessionLocation } from "./session-location";
import { WeekView } from "./week-view";

type AttendanceView = "day" | "week" | "month";

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
      {buildTimeline(session, now).map((segment) => (
        <li
          key={`${segment.kind}-${segment.startedAt}`}
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

function WindowNote({
  verdict,
  selfService,
}: {
  verdict: SelfServiceVerdict;
  selfService: SelfServiceWindow;
}) {
  const { t } = useTranslation();
  const mode = selfServiceMode(selfService);
  const days = selfService.days ?? 0;

  if (verdict === "OPEN") {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {mode === "NO_LIMIT"
          ? t.clock.windowNoLimitHint
          : mode === "DAYS"
            ? t.clock.windowDaysHint(days)
            : t.clock.windowZeroHint}
      </p>
    );
  }

  const text =
    verdict === "OFF"
      ? t.clock.windowOffNotice
      : verdict === "ENDED"
        ? t.clock.windowEndedNotice
        : mode === "DAYS"
          ? t.clock.windowOutsideDaysNotice(days)
          : t.clock.windowOutsideZeroNotice;

  return (
    <div className="bg-muted/50 flex gap-3 rounded-lg p-3">
      <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p className="text-sm">{text}</p>
    </div>
  );
}

/** Today reads from the clock's own answer rather than the day endpoint, so it moves with every click. */
function DayView({ date, today }: { date: string; today: string }) {
  const { t, locale } = useTranslation();
  const query = useAttendanceState();
  const state = query.data;
  const isToday = date === today;
  const pastQuery = useAttendanceDay(
    state && !isToday ? { organizationId: state.organizationId, businessDate: date } : null,
    !!state && !isToday
  );
  const now = useNow(state?.openSession != null);
  const [correcting, setCorrecting] = useState(false);

  const sessions = (isToday ? state?.sessions : pastQuery.data?.sessions) ?? [];
  // An organization that switched location off keeps what it already took, so
  // the strip follows the data as well as the switch.
  const showLocation = (state?.locationEnabled ?? false) || anySessionLocated(sessions);
  const verdictFor = (businessDate: string, open: boolean) =>
    state
      ? selfServiceVerdict({
          window: state.selfService,
          businessDate,
          today,
          open,
          employmentEnded: state.employmentEnded,
        })
      : null;
  // The day's own standing, for the note. An open session on it may still be
  // correctable when the day is not, which is decided session by session.
  const verdict = verdictFor(date, false);
  const correctable =
    state?.active === true &&
    state.businessDate !== null &&
    sessions.some((session) => verdictFor(session.businessDate, session.open) === "OPEN");

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
      <Card>
        <CardContent>
          <ClockWidget showAttendanceLink={false} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-2 [&_svg]:size-[18px]">
            <span className="flex items-center gap-2 first-letter:capitalize">
              <CalendarDays />
              {isToday ? t.clock.today : formatBusinessDay(date, locale)}
            </span>
            {correctable ? (
              <Button type="button" size="sm" variant="outline" onClick={() => setCorrecting(true)}>
                <Pencil />
                {isToday ? t.corrections.editToday : t.clock.correct}
              </Button>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!isToday && pastQuery.isPending ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t.common.loading}
            </p>
          ) : sessions.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {isToday ? t.clock.emptyDay : t.clock.emptyPastDay}
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
          {/* A lapsed plan closes every correction, and the clock already says so. */}
          {state?.active && verdict ? (
            <WindowNote verdict={verdict} selfService={state.selfService} />
          ) : null}
        </CardContent>
      </Card>

      {correctable && state ? (
        <CorrectionDialog
          organizationId={state.organizationId}
          businessDate={date}
          ownDay={{ today, selfService: state.selfService }}
          open={correcting}
          onOpenChange={setCorrecting}
        />
      ) : null}
    </div>
  );
}

/**
 * The week the anchor falls in. It is read as the one or two months it
 * straddles rather than as a range of its own: the month is what the endpoint
 * answers, and its totals are what the balance is measured against.
 */
function WeekRange({
  anchor,
  organizationId,
  enabled,
  locale,
}: {
  anchor: string;
  organizationId: string | null;
  enabled: boolean;
  locale: string;
}) {
  const { t } = useTranslation();
  const monday = startOfWeek(anchor);
  const months = monthsOfWeek(monday);
  const [first, second] = [months[0]!, months[1] ?? months[0]!];

  const firstQuery = useAttendanceMonth(first.year, first.month, organizationId, enabled);
  const secondQuery = useAttendanceMonth(
    second.year,
    second.month,
    organizationId,
    enabled && months.length === 2
  );

  const straddles = months.length === 2;

  if (firstQuery.isPending || (straddles && secondQuery.isPending)) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {t.common.loading}
      </p>
    );
  }

  // Both halves or neither. Half a straddling week would render as a complete
  // one — a total over four days under a heading that promises seven.
  if (!firstQuery.data || (straddles && !secondQuery.data)) {
    return (
      <p className="text-sm" style={{ color: "var(--destructive)" }}>
        {t.clock.rangeFailed}
      </p>
    );
  }

  const answered = straddles ? [firstQuery.data, secondQuery.data!] : [firstQuery.data];

  return (
    <WeekView
      days={pickDays(answered, weekDates(monday))}
      mode={firstQuery.data.balanceMode}
      today={firstQuery.data.businessDate}
      locale={locale}
    />
  );
}

function MonthRange({
  anchor,
  organizationId,
  enabled,
  locale,
}: {
  anchor: string;
  organizationId: string | null;
  enabled: boolean;
  locale: string;
}) {
  const { t } = useTranslation();
  const { year, month } = yearMonthOf(anchor);
  const query = useAttendanceMonth(year, month, organizationId, enabled);

  if (query.isPending) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {t.common.loading}
      </p>
    );
  }

  if (!query.data) {
    return (
      <p className="text-sm" style={{ color: "var(--destructive)" }}>
        {t.clock.rangeFailed}
      </p>
    );
  }

  return <MonthView month={query.data} locale={locale} />;
}

/** The range under the stepper, in the reader's own language and order. */
const rangeLabel = (view: AttendanceView, anchor: string, locale: string): string => {
  const at = (iso: string) => new Date(`${iso}T12:00:00Z`);

  if (view === "day") return formatBusinessDay(anchor, locale);

  if (view === "month") {
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(at(anchor));
  }

  const monday = startOfWeek(anchor);
  // `formatRange` rather than two formats and a dash: it is what puts the month
  // on the right side of the number in every language, and collapses the half
  // the two ends share.
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).formatRange(at(monday), at(addDays(monday, 6)));
};

/**
 * My attendance: today's clock, the week, and the month. Only the range moves
 * between them — the rules and the figures are the backend's, so the week and
 * the month cannot disagree with what an admin reads.
 */
export function MyAttendanceScreen() {
  const { t, locale } = useTranslation();
  const stateQuery = useAttendanceState();
  const [view, setView] = useState<AttendanceView>("day");
  const [anchored, setAnchored] = useState<string | null>(null);

  const organizationId = stateQuery.data?.organizationId ?? null;
  // The organization's day, not the browser's; the fallback only covers the
  // first render, before the clock's read has answered.
  const today = stateQuery.data?.businessDate ?? new Date().toISOString().slice(0, 10);
  const anchor = anchored ?? today;

  const step = (direction: -1 | 1) => {
    if (view === "day") {
      setAnchored(addDays(anchor, direction));
      return;
    }
    setAnchored(stepAnchor(view, anchor, direction));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.clock.title}</h1>
          <p style={{ color: "var(--text-muted)" }}>{t.clock.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="tablist"
            aria-label={t.clock.title}
            className="flex rounded-full border p-0.5"
            style={{ borderColor: "var(--border)" }}
          >
            {(["day", "week", "month"] as const).map((candidate) => (
              <button
                key={candidate}
                type="button"
                role="tab"
                aria-selected={view === candidate}
                onClick={() => {
                  setView(candidate);
                  setAnchored(null);
                }}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                  view === candidate
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.clock.views[candidate]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label={t.clock.previousRange}
              onClick={() => step(-1)}
            >
              <ChevronLeft />
            </Button>
            <span className="min-w-40 text-center font-semibold first-letter:capitalize">
              {rangeLabel(view, anchor, locale)}
            </span>
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label={t.clock.nextRange}
              // The day an employee reads is never one still to come.
              disabled={view === "day" && anchor >= today}
              onClick={() => step(1)}
            >
              <ChevronRight />
            </Button>
            {view === "day" && anchor !== today ? (
              <Button type="button" size="sm" variant="ghost" onClick={() => setAnchored(null)}>
                {t.clock.backToToday}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {view === "day" ? <DayView date={anchor} today={today} /> : null}
      {view === "week" ? (
        <WeekRange
          anchor={anchor}
          organizationId={organizationId}
          enabled={!!organizationId}
          locale={locale}
        />
      ) : null}
      {view === "month" ? (
        <MonthRange
          anchor={anchor}
          organizationId={organizationId}
          enabled={!!organizationId}
          locale={locale}
        />
      ) : null}
    </div>
  );
}
