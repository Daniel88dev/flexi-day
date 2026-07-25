"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plane,
  Users,
} from "lucide-react";
import { useDashboardSummary, useGroups, useVacations } from "@/lib/api/queries";
import { useSession } from "@/lib/auth-client";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  groupConsecutiveByUserType,
  LeaveCalendar,
  type CalendarRange,
} from "@/components/dashboard/leave-calendar";
import { ApprovalsWidget } from "@/components/dashboard/widgets/approvals-widget";
import { OutTodayWidget } from "@/components/dashboard/widgets/out-today-widget";
import { BalanceWidget } from "@/components/dashboard/widgets/balance-widget";
import { DEFAULT_LEAVE_TYPES, leaveMetaFor, type LeaveTypeKey } from "@/lib/demo/leave-meta";
import { VacationDetailDialog } from "@/components/vacation-detail-dialog";
import { NewRequestDialog } from "@/components/new-request-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { vacationStatus } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";

function todayParts() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

type GreetingKey = "night" | "morning" | "afternoon" | "evening";

function greetingKey(): GreetingKey {
  const h = new Date().getHours();
  if (h < 5) return "night";
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const initial = todayParts();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [filter, setFilter] = useState<Set<LeaveTypeKey>>(new Set(DEFAULT_LEAVE_TYPES));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [presetDate, setPresetDate] = useState<string | null>(null);
  const [newRequestOpen, setNewRequestOpen] = useState(false);

  const vacationsQuery = useVacations({ year, month });
  const groupsQuery = useGroups();
  const summaryQuery = useDashboardSummary();
  const session = useSession();

  const firstName = session.data?.user?.name?.split(" ")[0] ?? t.dashboard.fallbackName;

  const vacations = vacationsQuery.data ?? [];
  const groups = groupsQuery.data ?? [];
  const summary = summaryQuery.data;

  const ranges: CalendarRange[] = useMemo(() => {
    const live = vacations
      .filter((v) => vacationStatus(v) !== "rejected")
      .filter((v) => DEFAULT_LEAVE_TYPES.includes(v.vacationType as LeaveTypeKey))
      .map((v) => ({
        id: v.id,
        userId: v.userId,
        vacationType: v.vacationType as LeaveTypeKey,
        requestedDay: v.requestedDay,
        user: v.user,
        note: v.note,
      }));
    return groupConsecutiveByUserType(live);
  }, [vacations]);

  const today = new Date();
  const todayMatches = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDay = todayMatches ? today.getDate() : null;

  const monthDays = new Date(year, month, 0).getDate();
  const firstDayJs = new Date(year, month - 1, 1).getDay();
  const firstWeekdayMondayIdx = (firstDayJs + 6) % 7;

  function toggleType(id: LeaveTypeKey) {
    const next = new Set(filter);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFilter(next);
  }

  function shiftMonth(delta: number) {
    let nm = month + delta;
    let ny = year;
    while (nm <= 0) {
      nm += 12;
      ny -= 1;
    }
    while (nm > 12) {
      nm -= 12;
      ny += 1;
    }
    setMonth(nm);
    setYear(ny);
  }

  function openNewRequestForDay(day: number) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setPresetDate(iso);
    setNewRequestOpen(true);
  }

  const noGroups = groups.length === 0 && !groupsQuery.isLoading;

  return (
    <div className="flex flex-col gap-7">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1
            className="font-display font-semibold"
            style={{ fontSize: 34, letterSpacing: "-0.02em", marginBottom: 4 }}
          >
            {t.dashboard.greeting(t.dashboard.greetings[greetingKey()], firstName)}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 16 }}>{t.dashboard.subtitle}</p>
        </div>
        {summary ? (
          <span className="text-[13.5px]" style={{ color: "var(--text-muted)" }}>
            {t.dashboard.teammates(summary.teamSize)}
          </span>
        ) : null}
      </div>

      {noGroups ? (
        <Card>
          <CardContent className="space-y-3 py-8 text-center">
            <p className="font-display text-lg font-semibold">{t.dashboard.noGroupsTitle}</p>
            <p className="text-muted-foreground text-sm">{t.dashboard.noGroupsBody}</p>
            <div className="flex justify-center gap-2 pt-2">
              <Button asChild>
                <Link href="/groups">{t.dashboard.manageGroups}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          tint="var(--warm)"
          label={t.dashboard.stats.pendingApprovals}
          value={summary?.pendingApprovalsCount ?? 0}
          sub={t.dashboard.stats.pendingApprovalsSub}
          accentValue
        />
        <StatCard
          icon={<Plane className="h-5 w-5" />}
          tint="var(--c-vacation)"
          label={t.dashboard.stats.outToday}
          value={summary?.outTodayCount ?? 0}
          sub={t.dashboard.stats.outTodaySub}
        />
        <StatCard
          icon={<CalendarIcon className="h-5 w-5" />}
          tint="var(--c-pto)"
          label={t.dashboard.stats.comingUp}
          value={summary?.upcomingNext14DaysCount ?? 0}
          sub={t.dashboard.stats.comingUpSub}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          tint="var(--c-home)"
          label={t.dashboard.stats.workingToday}
          value={summary?.workingTodayCount ?? 0}
          sub={t.dashboard.stats.workingTodaySub}
        />
      </div>

      {/* Calendar + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-[22px] font-semibold">
                {t.calendar.months[month - 1]} {year}
              </h2>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  aria-label={t.dashboard.prevMonth}
                  className="grid h-8 w-8 place-items-center rounded-[9px] border"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border-strong)",
                    color: "var(--text-muted)",
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  aria-label={t.dashboard.nextMonth}
                  className="grid h-8 w-8 place-items-center rounded-[9px] border"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border-strong)",
                    color: "var(--text-muted)",
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              {vacationsQuery.isLoading ? (
                <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                  {t.common.loading}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_LEAVE_TYPES.map((id) => {
                const meta = leaveMetaFor(id);
                const on = filter.has(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleType(id)}
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
                      style={{
                        background: on ? meta.cssVar : "var(--text-faint)",
                      }}
                    />
                    {t.leaveTypes[id].label}
                  </button>
                );
              })}
            </div>
          </div>
          <LeaveCalendar
            monthDays={monthDays}
            firstWeekdayMondayIdx={firstWeekdayMondayIdx}
            todayDay={todayDay}
            ranges={ranges}
            filter={filter}
            onSelect={(id) => {
              setSelectedId(id);
              setDetailOpen(true);
            }}
            onDayClick={openNewRequestForDay}
          />
          {vacationsQuery.error ? (
            <p className="mt-3 text-sm" style={{ color: "var(--destructive)" }}>
              {vacationsQuery.error.message}
            </p>
          ) : null}
        </section>

        <aside className="flex flex-col gap-4">
          <ApprovalsWidget />
          <OutTodayWidget vacations={vacations} todayDay={todayDay} />
          <BalanceWidget year={year} />
        </aside>
      </div>

      <VacationDetailDialog
        vacationId={selectedId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <NewRequestDialog
        key={presetDate ?? "new"}
        open={newRequestOpen}
        onOpenChange={setNewRequestOpen}
        initialDate={presetDate ?? undefined}
      />
    </div>
  );
}
