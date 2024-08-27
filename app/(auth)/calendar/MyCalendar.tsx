"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const scheduleTypes = {
  vacation: { label: "Vacation", color: "bg-blue-200" },
  homeOffice: { label: "Home Office", color: "bg-green-200" },
};

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

type Schedule = {
  [key: string]: "vacation" | "homeOffice";
};

const mockSchedule: Schedule = {
  "2024-05-15": "vacation",
  "2024-05-16": "vacation",
  "2024-05-17": "vacation",
  "2024-06-10": "homeOffice",
  "2024-06-11": "homeOffice",
  "2024-07-20": "vacation",
  "2024-07-21": "vacation",
  "2024-08-05": "homeOffice",
  "2024-09-15": "vacation",
  "2024-10-01": "homeOffice",
  "2024-10-02": "homeOffice",
  "2024-11-23": "vacation",
  "2024-11-24": "vacation",
  "2024-12-24": "vacation",
  "2024-12-25": "vacation",
  "2024-12-26": "vacation",
};

const months = [
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

const MonthCalendar = ({ year, month }: { year: number; month: number }) => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const adjustedFirstDay = (firstDayOfMonth + 6) % 7;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {months[month]} {year}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
            <div key={day} className="font-semibold">
              {day}
            </div>
          ))}
          {Array.from({ length: adjustedFirstDay }).map((_, index) => (
            <div key={`empty-${index}`} />
          ))}
          {days.map((day) => {
            const date = `${year}-${String(month + 1).padStart(
              2,
              "0"
            )}-${String(day).padStart(2, "0")}`;
            const scheduleType = mockSchedule[date];
            return (
              <div
                key={day}
                className={`aspect-square flex items-center justify-center text-sm ${
                  scheduleType ? scheduleTypes[scheduleType].color : ""
                }`}
                title={
                  scheduleType
                    ? `${scheduleTypes[scheduleType].label} on ${months[month]} ${day}, ${year}`
                    : ""
                }
              >
                {day}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const MyCalendar = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const years = Array.from({ length: 5 }, (_, i) =>
    (currentYear + i - 2).toString()
  );

  return (
    <div className="container space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">My Calendar</h1>
      <Card>
        <CardHeader>
          <CardTitle>Year Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {months.map((_, index) => (
          <MonthCalendar
            key={index}
            year={parseInt(selectedYear)}
            month={index}
          />
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-2 items-start">
        {Object.entries(scheduleTypes).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-4 h-4 ${value.color}`}></div>
            <span>{value.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyCalendar;
