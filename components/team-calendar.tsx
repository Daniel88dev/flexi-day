"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TEAM_MEMBERS,
  LEAVE_TYPE_COLORS,
  LEAVE_TYPE_LABELS,
  LeaveRequest,
  getMemberById,
  getInitials,
} from "@/lib/data";
import { cn } from "@/lib/utils";

interface TeamCalendarProps {
  requests: LeaveRequest[];
}

function isBetween(date: Date, start: string, end: string) {
  const d = date.toISOString().slice(0, 10);
  return d >= start && d <= end;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
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

export function TeamCalendar({ requests }: TeamCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday-based offset (0=Mon ... 6=Sun)
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const approvedRequests = requests.filter((r) => r.status === "approved");

  function getRequestsForDay(dayNum: number): LeaveRequest[] {
    const date = new Date(year, month, dayNum);
    return approvedRequests.filter((r) => isBetween(date, r.startDate, r.endDate));
  }

  const todayStr = today.toISOString().slice(0, 10);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">
          {MONTH_NAMES[month]} {year}
        </h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon-sm" onClick={prevMonth}>
            ‹
          </Button>
          <Button variant="outline" size="icon-sm" onClick={nextMonth}>
            ›
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {(Object.entries(LEAVE_TYPE_LABELS) as [keyof typeof LEAVE_TYPE_COLORS, string][]).map(
          ([type, label]) => (
            <span
              key={type}
              className={cn("rounded-full px-2 py-0.5 font-medium", LEAVE_TYPE_COLORS[type])}
            >
              {label}
            </span>
          )
        )}
      </div>

      <div className="border-border overflow-hidden rounded-lg border">
        {/* Header row */}
        <div className="bg-muted/50 grid grid-cols-7">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-muted-foreground py-2 text-center text-xs font-medium">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="divide-border grid grid-cols-7 divide-x">
          {Array.from({ length: totalCells }).map((_, i) => {
            const dayNum = i - startOffset + 1;
            const isValid = dayNum >= 1 && dayNum <= daysInMonth;
            const dateStr = isValid
              ? `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`
              : "";
            const isToday = dateStr === todayStr;
            const dayRequests = isValid ? getRequestsForDay(dayNum) : [];
            const isWeekend = i % 7 >= 5;

            return (
              <div
                key={i}
                className={cn(
                  "border-border min-h-[80px] border-b p-1.5",
                  !isValid && "bg-muted/20",
                  isWeekend && isValid && "bg-muted/30"
                )}
              >
                {isValid && (
                  <>
                    <div
                      className={cn(
                        "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                        isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                      )}
                    >
                      {dayNum}
                    </div>
                    <div className="space-y-0.5">
                      {dayRequests.slice(0, 3).map((req) => {
                        const member = getMemberById(req.memberId);
                        if (!member) return null;
                        return (
                          <div
                            key={req.id}
                            className={cn(
                              "flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] font-medium",
                              LEAVE_TYPE_COLORS[req.type]
                            )}
                            title={`${member.name} — ${LEAVE_TYPE_LABELS[req.type]}`}
                          >
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/30 text-[9px] font-semibold">
                              {getInitials(member.name)}
                            </span>
                            <span className="truncate">{member.name.split(" ")[0]}</span>
                          </div>
                        );
                      })}
                      {dayRequests.length > 3 && (
                        <div className="text-muted-foreground pl-1 text-[10px]">
                          +{dayRequests.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
