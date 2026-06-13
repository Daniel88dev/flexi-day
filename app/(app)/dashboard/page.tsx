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
import { useGroups, useVacations } from "@/lib/api/queries";
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
import { AvatarStack } from "@/components/brand/avatar-bubble";
import { DEFAULT_LEAVE_TYPES, leaveMetaFor, type LeaveTypeKey } from "@/lib/demo/leave-meta";
import { DEMO_TEAM } from "@/lib/demo/team";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { vacationStatus } from "@/lib/api/types";

function todayParts() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const initial = todayParts();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [filter, setFilter] = useState<Set<LeaveTypeKey>>(new Set(DEFAULT_LEAVE_TYPES));

  const vacationsQuery = useVacations({ year, month });
  const groupsQuery = useGroups();
  const session = useSession();

  const firstName = session.data?.user?.name?.split(" ")[0] ?? "there";

  const vacations = vacationsQuery.data ?? [];
  const groups = groupsQuery.data ?? [];

  // Group consecutive single-day vacation rows into multi-day calendar ranges.
  const ranges: CalendarRange[] = useMemo(() => {
    const live = vacations
      .filter((v) => vacationStatus(v) !== "rejected")
      .filter((v) => DEFAULT_LEAVE_TYPES.includes(v.vacationType as LeaveTypeKey))
      .map((v) => ({
        userId: v.userId,
        vacationType: v.vacationType as LeaveTypeKey,
        requestedDay: v.requestedDay,
      }));
    return groupConsecutiveByUserType(live);
  }, [vacations]);

  const today = new Date();
  const todayMatches = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDay = todayMatches ? today.getDate() : null;

  const outToday = ranges.filter(
    (r) => todayDay !== null && r.from <= todayDay && r.to >= todayDay && r.who !== "all"
  ).length;
  const coming = new Set(
    ranges
      .filter(
        (r) => todayDay !== null && r.from > todayDay && r.from <= todayDay + 14 && r.who !== "all"
      )
      .map((r) => r.who)
  ).size;
  const pending = vacations.filter((v) => vacationStatus(v) === "pending").length;

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
            {greeting()}, {firstName}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 16 }}>
            Here&apos;s who&apos;s in, who&apos;s out, and what&apos;s coming up.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AvatarStack people={DEMO_TEAM} size={34} max={6} />
          <span className="text-[13.5px]" style={{ color: "var(--text-muted)" }}>
            {/* TODO: replace DEMO_TEAM with real teammate count from the user's groups. */}
            {DEMO_TEAM.length} teammates
          </span>
        </div>
      </div>

      {noGroups ? (
        <Card>
          <CardContent className="space-y-3 py-8 text-center">
            <p className="font-display text-lg font-semibold">No groups yet</p>
            <p className="text-muted-foreground text-sm">
              Create a group or join one with an invite code to start tracking time off.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Button asChild>
                <Link href="/groups">Manage groups</Link>
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
          label="Pending approvals"
          value={pending}
          sub="need review"
          accentValue
        />
        <StatCard
          icon={<Plane className="h-5 w-5" />}
          tint="var(--c-vacation)"
          label="Out today"
          value={outToday}
          sub="away from desk"
        />
        <StatCard
          icon={<CalendarIcon className="h-5 w-5" />}
          tint="var(--c-pto)"
          label="Coming up · 14d"
          value={coming}
          sub="upcoming leaves"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          tint="var(--c-home)"
          label="Working today"
          value={Math.max(0, DEMO_TEAM.length - outToday)}
          sub="at their desk"
        />
      </div>

      {/* Calendar + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-[22px] font-semibold">
                {MONTH_NAMES[month - 1]} {year}
              </h2>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  aria-label="Previous month"
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
                  aria-label="Next month"
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
                  Loading…
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
                    {meta.label}
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
          />
          {vacationsQuery.error ? (
            <p className="mt-3 text-sm" style={{ color: "var(--destructive)" }}>
              {vacationsQuery.error.message}
            </p>
          ) : null}
        </section>

        <aside className="flex flex-col gap-4">
          <ApprovalsWidget />
          <OutTodayWidget />
          <BalanceWidget />
        </aside>
      </div>
    </div>
  );
}
