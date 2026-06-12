"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getMemberById,
  getInitials,
  countBusinessDays,
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_COLORS,
  LeaveRequest,
} from "@/lib/data";
import { cn } from "@/lib/utils";

type Filter = "all" | "pending" | "approved" | "rejected";

const STATUS_BADGE: Record<LeaveRequest["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function RequestsPage() {
  const { requests, updateStatus } = useStore();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Requests</h1>
        <p className="text-muted-foreground mt-1 text-sm">Review and manage all leave requests.</p>
      </div>

      {/* Filter tabs */}
      <div className="border-border flex gap-1 border-b pb-0">
        {(["all", "pending", "approved", "rejected"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium capitalize transition-colors",
              filter === f
                ? "border-primary text-primary"
                : "text-muted-foreground hover:text-foreground border-transparent"
            )}
          >
            {f}
            <span className="bg-muted text-muted-foreground ml-1.5 rounded-full px-1.5 py-0.5 text-xs">
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-muted-foreground py-16 text-center text-sm">
          No {filter !== "all" ? filter : ""} requests found.
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Member</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((req) => {
                const member = getMemberById(req.memberId);
                if (!member) return null;
                const days = countBusinessDays(req.startDate, req.endDate);

                return (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
                            member.avatarColor
                          )}
                        >
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{member.name}</div>
                          <div className="text-muted-foreground text-xs">{member.role}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          LEAVE_TYPE_COLORS[req.type]
                        )}
                      >
                        {LEAVE_TYPE_LABELS[req.type]}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(req.startDate)}
                      {req.startDate !== req.endDate && (
                        <>
                          <span className="text-muted-foreground mx-1">→</span>
                          {formatDate(req.endDate)}
                        </>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {days} {days === 1 ? "day" : "days"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          STATUS_BADGE[req.status]
                        )}
                      >
                        {req.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[160px] truncate text-xs">
                      {req.notes ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {req.status === "pending" && (
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="xs"
                            variant="outline"
                            className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/30"
                            onClick={() => updateStatus(req.id, "approved")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                            onClick={() => updateStatus(req.id, "rejected")}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {req.status !== "pending" && (
                        <Button
                          size="xs"
                          variant="ghost"
                          className="text-muted-foreground"
                          onClick={() => updateStatus(req.id, "pending")}
                        >
                          Reset
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
