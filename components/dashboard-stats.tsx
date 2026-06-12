"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaveRequest, getMemberById, TEAM_MEMBERS } from "@/lib/data";
import { getInitials } from "@/lib/data";
import { cn } from "@/lib/utils";

interface DashboardStatsProps {
  requests: LeaveRequest[];
}

export function DashboardStats({ requests }: DashboardStatsProps) {
  const today = new Date().toISOString().slice(0, 10);

  const pending = requests.filter((r) => r.status === "pending");
  const onLeaveToday = requests.filter(
    (r) => r.status === "approved" && today >= r.startDate && today <= r.endDate
  );
  const upcomingThisWeek = requests.filter((r) => {
    if (r.status !== "approved") return false;
    const start = new Date(r.startDate);
    const now = new Date(today);
    const diff = (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 7;
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Pending Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-heading text-primary text-3xl font-bold">{pending.length}</div>
          <p className="text-muted-foreground mt-1 text-xs">
            {pending.length === 0
              ? "All caught up!"
              : `${pending.length} request${pending.length > 1 ? "s" : ""} waiting`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">Out Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-heading text-3xl font-bold">
            {onLeaveToday.length}
            <span className="text-muted-foreground text-lg font-normal">
              /{TEAM_MEMBERS.length}
            </span>
          </div>
          {onLeaveToday.length > 0 && (
            <div className="mt-2 flex -space-x-1">
              {onLeaveToday.slice(0, 5).map((r) => {
                const m = getMemberById(r.memberId);
                if (!m) return null;
                return (
                  <div
                    key={r.id}
                    className={cn(
                      "border-card flex h-6 w-6 items-center justify-center rounded-full border-2 text-[9px] font-bold text-white",
                      m.avatarColor
                    )}
                    title={m.name}
                  >
                    {getInitials(m.name)}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Starting This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-heading text-3xl font-bold">{upcomingThisWeek.length}</div>
          {upcomingThisWeek.length > 0 ? (
            <div className="mt-1 space-y-0.5">
              {upcomingThisWeek.slice(0, 2).map((r) => {
                const m = getMemberById(r.memberId);
                if (!m) return null;
                return (
                  <p key={r.id} className="text-muted-foreground text-xs">
                    {m.name.split(" ")[0]} —{" "}
                    {new Date(r.startDate).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground mt-1 text-xs">No upcoming leave</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
