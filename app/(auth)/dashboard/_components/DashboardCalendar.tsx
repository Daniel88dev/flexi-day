"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useState } from "react";

const EXAMPLE_DAYS = [
  new Date(2024, 9, 9),
  new Date(2024, 9, 20),
  new Date(2024, 10, 12),
  new Date(2024, 11, 24),
];

const EXAMPLE_HOME_OFFICE = [new Date(2024, 9, 10), new Date(2024, 9, 21)];

const DashboardCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={"flex"}>
          <CalendarComponent
            mode={"single"}
            selected={date}
            onSelect={setDate}
            className={"rounded-md border w-[280px]"}
            weekStartsOn={1}
            modifiers={{
              vacation: EXAMPLE_DAYS,
              homeOffice: EXAMPLE_HOME_OFFICE,
            }}
            modifiersClassNames={{
              vacation: "bg-violet-500",
              homeOffice: "bg-yellow-500 text-black",
            }}
          />
          <div className={"flex flex-col ml-4"}>
            <div className={"flex gap-2 py-2"}>
              <div className={"w-6 h-6 bg-violet-500 rounded-md"} />
              <p>Vacation</p>
            </div>
            <div className={"flex gap-2 py-2"}>
              <div className={"w-6 h-6 bg-yellow-500 rounded-md"} />
              <p className={"text-nowrap"}>Home Office</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardCalendar;
