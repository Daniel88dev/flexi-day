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
import {
  useBankHolidaysMulti,
  useDashboardSummary,
  useGroup,
  useGroups,
  useMySettings,
  useReportScope,
  useVacations,
} from "@/lib/api/queries";
import { bankHolidaysToRanges } from "@/lib/holidays";
import { useSession } from "@/lib/auth-client";
import { ApiError } from "@/lib/api/client";
import type { DashboardScope } from "@/lib/api/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { MobileStatStrip, type MobileStat } from "@/components/dashboard/mobile-stat-strip";
import {
  groupConsecutiveByUserType,
  LeaveCalendar,
  type CalendarRange,
} from "@/components/dashboard/leave-calendar";
import { ApprovalsWidget } from "@/components/dashboard/widgets/approvals-widget";
import { OutTodayWidget } from "@/components/dashboard/widgets/out-today-widget";
import { BalanceWidget } from "@/components/dashboard/widgets/balance-widget";
import { DEFAULT_LEAVE_TYPES, type LeaveTypeKey } from "@/lib/demo/leave-meta";
import { LeaveTypeFilter } from "@/components/dashboard/leave-type-filter";
import { NewRequestDialog } from "@/components/new-request-dialog";
import { useOpenVacationDetail } from "@/lib/vacations/use-vacation-detail";
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
  const [presetDate, setPresetDate] = useState<string | null>(null);
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  // Session-only overrides of the stored preference — a look at the team
  // without committing to it in settings.
  const [scopeOverride, setScopeOverride] = useState<DashboardScope | null>(null);
  const [groupOverride, setGroupOverride] = useState<string | null>(null);

  const groupsQuery = useGroups();
  const summaryQuery = useDashboardSummary();
  const settingsQuery = useMySettings();
  const reportScopeQuery = useReportScope();
  const session = useSession();
  const { openVacation } = useOpenVacationDetail();

  // Only groups the caller may see in full; the API refuses the rest.
  const viewableGroups = useMemo(
    () => (reportScopeQuery.data?.groups ?? []).filter((g) => g.access === "all"),
    [reportScopeQuery.data]
  );

  const preferredGroupId = groupOverride ?? settingsQuery.data?.dashboardGroupId ?? null;
  const selectedGroupId =
    viewableGroups.find((g) => g.groupId === preferredGroupId)?.groupId ??
    viewableGroups[0]?.groupId ??
    null;
  const scope: DashboardScope =
    (scopeOverride ?? settingsQuery.data?.dashboardScope ?? "MINE") === "GROUP" && selectedGroupId
      ? "GROUP"
      : "MINE";
  const activeGroupId = scope === "GROUP" ? selectedGroupId : null;

  const vacationsQuery = useVacations({ year, month, groupId: activeGroupId });
  // The membership list already carries `holidayCountry`; the detail fetch is
  // only for groups the caller sees without a membership (org admins). Report
  // scope can also grant GROUP view to a manager the detail endpoint refuses,
  // so hitting it for in-list groups would 403 for exactly them.
  const activeGroupFromList = (groupsQuery.data ?? []).find((g) => g.id === activeGroupId);
  // Wait for the list before falling back — firing while it loads would hit
  // the detail endpoint for in-list groups after all.
  const activeGroupQuery = useGroup(
    groupsQuery.isPending || activeGroupFromList ? null : activeGroupId
  );

  const firstName = session.data?.user?.name?.split(" ")[0] ?? t.dashboard.fallbackName;

  // `?? []` builds a new array on every render while the query is empty, which
  // would change the `ranges` dependency each time and defeat the memo below.
  const vacations = useMemo(() => vacationsQuery.data ?? [], [vacationsQuery.data]);
  const groups = groupsQuery.data ?? [];
  const summary = summaryQuery.data;

  // GROUP scope shows the selected group's holidays; MINE merges every country
  // across the caller's groups (deduped per date in bankHolidaysToRanges).
  const activeGroupCountry =
    activeGroupFromList?.holidayCountry ?? activeGroupQuery.data?.holidayCountry;
  const holidayCountries = useMemo(() => {
    if (scope === "GROUP") return activeGroupCountry ? [activeGroupCountry] : [];
    return Array.from(
      new Set(
        (groupsQuery.data ?? []).map((g) => g.holidayCountry).filter((c): c is string => !!c)
      )
    );
  }, [scope, activeGroupCountry, groupsQuery.data]);
  const bankHolidays = useBankHolidaysMulti(year, holidayCountries);

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
        mirroredFromGroupName: v.mirroredFromGroupName,
      }));
    return [...groupConsecutiveByUserType(live), ...bankHolidaysToRanges(bankHolidays, year, month)];
  }, [vacations, bankHolidays, year, month]);

  const today = new Date();
  const todayMatches = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDay = todayMatches ? today.getDate() : null;

  const monthDays = new Date(year, month, 0).getDate();
  const firstDayJs = new Date(year, month - 1, 1).getDay();
  const firstWeekdayMondayIdx = (firstDayJs + 6) % 7;

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

  const stats: MobileStat[] = [
    {
      id: "pending",
      icon: <Clock className="h-5 w-5" />,
      tint: "var(--warm)",
      label: t.dashboard.stats.pendingApprovals,
      value: summary?.pendingApprovalsCount ?? 0,
      sub: t.dashboard.stats.pendingApprovalsSub,
      href: "/requests",
      accentValue: true,
    },
    {
      id: "out-today",
      icon: <Plane className="h-5 w-5" />,
      tint: "var(--c-vacation)",
      label: t.dashboard.stats.outToday,
      value: summary?.outTodayCount ?? 0,
      sub: t.dashboard.stats.outTodaySub,
    },
    {
      id: "coming-up",
      icon: <CalendarIcon className="h-5 w-5" />,
      tint: "var(--c-pto)",
      label: t.dashboard.stats.comingUp,
      value: summary?.upcomingNext14DaysCount ?? 0,
      sub: t.dashboard.stats.comingUpSub,
      href: "/requests",
    },
    {
      id: "working-today",
      icon: <Users className="h-5 w-5" />,
      tint: "var(--c-home)",
      label: t.dashboard.stats.workingToday,
      value: summary?.workingTodayCount ?? 0,
      sub: t.dashboard.stats.workingTodaySub,
    },
  ];

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
      <MobileStatStrip stats={stats} className="sm:hidden" />
      <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.id}
            icon={stat.icon}
            tint={stat.tint}
            label={stat.label}
            value={stat.value}
            sub={stat.sub}
            accentValue={stat.accentValue}
          />
        ))}
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
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {viewableGroups.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[12.5px]" style={{ color: "var(--text-faint)" }}>
                    {t.dashboard.scope.label}
                  </span>
                  <div className="flex gap-1">
                    {(["MINE", "GROUP"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={scope === value}
                        onClick={() => setScopeOverride(value)}
                        className={cn(
                          "rounded-full px-3 py-[5px] text-[12.5px] font-semibold transition-colors",
                          scope === value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:ring-foreground/30 hover:ring-1"
                        )}
                      >
                        {value === "MINE" ? t.dashboard.scope.mine : t.dashboard.scope.group}
                      </button>
                    ))}
                  </div>
                  {scope === "GROUP" && viewableGroups.length > 1 ? (
                    <Select
                      value={selectedGroupId ?? ""}
                      onValueChange={(value) => setGroupOverride(value)}
                    >
                      <SelectTrigger size="sm" aria-label={t.dashboard.scope.groupPicker}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {viewableGroups.map((group) => (
                          <SelectItem key={group.groupId} value={group.groupId}>
                            {group.groupName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>
              ) : null}
              <LeaveTypeFilter value={filter} onChange={setFilter} />
            </div>
          </div>
          <LeaveCalendar
            monthDays={monthDays}
            firstWeekdayMondayIdx={firstWeekdayMondayIdx}
            todayDay={todayDay}
            ranges={ranges}
            filter={filter}
            onSelect={openVacation}
            onDayClick={openNewRequestForDay}
          />
          {vacationsQuery.error ? (
            <p className="mt-3 text-sm" style={{ color: "var(--destructive)" }}>
              {vacationsQuery.error instanceof ApiError && vacationsQuery.error.status === 403
                ? t.dashboard.scope.forbidden
                : vacationsQuery.error.message}
            </p>
          ) : null}
        </section>

        <aside className="flex flex-col gap-4">
          <ApprovalsWidget />
          <OutTodayWidget vacations={vacations} todayDay={todayDay} />
          <BalanceWidget year={year} />
        </aside>
      </div>

      <NewRequestDialog
        key={presetDate ?? "new"}
        open={newRequestOpen}
        onOpenChange={setNewRequestOpen}
        initialDate={presetDate ?? undefined}
      />
    </div>
  );
}
