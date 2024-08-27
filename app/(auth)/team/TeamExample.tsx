"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type UserSchedule = {
  [day: number]: "vacation" | "homeOffice";
};

type Schedule = {
  [userId: number]: UserSchedule;
};

const TeamExample = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());

  const teamMembers: { id: number; name: string }[] = [
    { id: 1, name: "Alice Johnson" },
    { id: 2, name: "Bob Smith" },
    { id: 3, name: "Charlie Brown" },
    { id: 4, name: "Diana Martinez" },
  ];

  const scheduleTypes = {
    vacation: { label: "Vacation", color: "bg-blue-200" },
    homeOffice: { label: "Home Office", color: "bg-green-200" },
  };

  const mockSchedule: Schedule = {
    1: {
      5: "vacation",
      6: "vacation",
      7: "vacation",
      15: "homeOffice",
      16: "homeOffice",
    },
    2: {
      12: "vacation",
      13: "vacation",
      14: "vacation",
      22: "homeOffice",
      23: "homeOffice",
    },
    3: { 8: "homeOffice", 9: "homeOffice", 19: "vacation", 20: "vacation" },
    4: {
      1: "homeOffice",
      2: "homeOffice",
      26: "vacation",
      27: "vacation",
      28: "vacation",
    },
  };

  const dayAbbreviations: string[] = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const years: string[] = Array.from({ length: 5 }, (_, i) =>
    (currentYear + i).toString()
  );
  const months: string[] = [
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

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getDayOfWeek = (year: number, month: number, day: number) => {
    return new Date(year, month, day).getDay();
  };

  return (
    <div className="container space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Team Schedule</h1>
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
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
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            Team Schedule - {months[parseInt(selectedMonth)]} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Team Member</TableHead>
                  {Array.from(
                    {
                      length: getDaysInMonth(
                        parseInt(selectedYear),
                        parseInt(selectedMonth)
                      ),
                    },
                    (_, i) => {
                      const day = i + 1;
                      const dayOfWeek = getDayOfWeek(
                        parseInt(selectedYear),
                        parseInt(selectedMonth),
                        day
                      );
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                      return (
                        <TableHead
                          key={day}
                          className={`text-center w-10 ${
                            isWeekend ? "bg-muted" : ""
                          }`}
                        >
                          <div>{day}</div>
                          <div className="text-xs">
                            {dayAbbreviations[dayOfWeek]}
                          </div>
                        </TableHead>
                      );
                    }
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    {Array.from(
                      {
                        length: getDaysInMonth(
                          parseInt(selectedYear),
                          parseInt(selectedMonth)
                        ),
                      },
                      (_, i) => {
                        const day = i + 1;
                        const dayOfWeek = getDayOfWeek(
                          parseInt(selectedYear),
                          parseInt(selectedMonth),
                          day
                        );
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        const scheduleType = mockSchedule[member.id]?.[day];
                        return (
                          <TableCell
                            key={day}
                            className={`text-center p-0 ${
                              isWeekend ? "bg-muted" : ""
                            }`}
                          >
                            {scheduleType && (
                              <div
                                className={`w-full h-full ${scheduleTypes[scheduleType].color}`}
                                title={`${member.name}: ${
                                  scheduleTypes[scheduleType].label
                                } on ${
                                  months[parseInt(selectedMonth)]
                                } ${day}, ${selectedYear} (${
                                  dayAbbreviations[dayOfWeek]
                                })`}
                              >
                                &nbsp;
                              </div>
                            )}
                          </TableCell>
                        );
                      }
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-col sm:flex-row gap-2 items-start">
        {Object.entries(scheduleTypes).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-4 h-4 ${value.color}`}></div>
            <span>{value.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-muted"></div>
          <span>Weekend</span>
        </div>
      </div>
    </div>
  );
};

export default TeamExample;
