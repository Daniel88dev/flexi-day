"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

const Dashboard = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const vacationQuota = { used: 10, total: 25 };
  const homeOfficeQuota = { used: 15, total: 40 };

  return (
    <div className="container grid gap-6 md:gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Vacation Days
              </CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vacationQuota.used} / {vacationQuota.total}
              </div>
              <Progress
                value={(vacationQuota.used / vacationQuota.total) * 100}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Days used this year
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Home Office Days
              </CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {homeOfficeQuota.used} / {homeOfficeQuota.total}
              </div>
              <Progress
                value={(homeOfficeQuota.used / homeOfficeQuota.total) * 100}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Days used this year
              </p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Button>Request Vacation</Button>
            <Button variant="outline">Request Home Office</Button>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarComponent
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
