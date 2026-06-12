"use client";

import { useStore } from "@/lib/store";
import { DashboardStats } from "@/components/dashboard-stats";
import { TeamCalendar } from "@/components/team-calendar";

export default function DashboardPage() {
  const { requests } = useStore();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">Team Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          See who&apos;s in, who&apos;s out, and what&apos;s coming up.
        </p>
      </div>
      <DashboardStats requests={requests} />
      <TeamCalendar requests={requests} />
    </div>
  );
}
