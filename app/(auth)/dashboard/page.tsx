"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import VacationCard from "@/app/(auth)/dashboard/_components/VacationCard";
import QuickActions from "@/app/(auth)/dashboard/_components/QuickActions";
import DashboardCalendar from "@/app/(auth)/dashboard/_components/DashboardCalendar";

const Dashboard = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const vacationQuota = { used: 10, total: 25 };
  const homeOfficeQuota = { used: 15, total: 40 };

  return (
    <div className="container grid gap-6 md:gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2">
          <VacationCard
            type={"vacation"}
            used={vacationQuota.used}
            total={vacationQuota.total}
          />
          <VacationCard
            type={"homeOffice"}
            used={homeOfficeQuota.used}
            total={homeOfficeQuota.total}
          />
        </div>
        <QuickActions />
      </div>
      <DashboardCalendar />
    </div>
  );
};

export default Dashboard;
