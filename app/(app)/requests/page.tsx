"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { VacationDetailDialog } from "@/components/vacation-detail-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useApproveVacation,
  useCancelVacation,
  useGroups,
  useRejectVacation,
  useVacations,
} from "@/lib/api/queries";
import { useSession } from "@/lib/auth-client";
import {
  VACATION_KIND_COLORS,
  VACATION_KIND_LABELS,
  vacationStatus,
  type VacationListItem,
  type VacationStatus,
} from "@/lib/api/types";
import { cn } from "@/lib/utils";

type Filter = "all" | VacationStatus | "mine";

const STATUS_BADGE: Record<VacationStatus, string> = {
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

function MonthPicker({
  year,
  month,
  onChange,
}: {
  year: number;
  month: number;
  onChange: (y: number, m: number) => void;
}) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => {
          if (month === 1) onChange(year - 1, 12);
          else onChange(year, month - 1);
        }}
      >
        ‹
      </Button>
      <span className="text-foreground/80 font-heading w-[110px] text-center text-sm font-medium">
        {months[month - 1]} {year}
      </span>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => {
          if (month === 12) onChange(year + 1, 1);
          else onChange(year, month + 1);
        }}
      >
        ›
      </Button>
    </div>
  );
}

export default function RequestsPage() {
  return (
    <Suspense fallback={null}>
      <RequestsTable />
    </Suspense>
  );
}

function RequestsTable() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [filter, setFilter] = useState<Filter>("all");

  // Notification emails deep-link here with ?vacationId=…, so a request can be
  // opened straight from the inbox.
  const search = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(search.get("vacationId"));
  const [detailOpen, setDetailOpen] = useState(Boolean(search.get("vacationId")));

  function openDetail(id: string) {
    setSelectedId(id);
    setDetailOpen(true);
  }

  const { data: session } = useSession();
  const userId = session?.user?.id;

  const groupsQuery = useGroups();
  const vacationsQuery = useVacations({ year, month });
  const approve = useApproveVacation();
  const reject = useRejectVacation();
  const cancel = useCancelVacation();
  const isMutating = approve.isPending || reject.isPending || cancel.isPending;

  const vacations: VacationListItem[] = vacationsQuery.data ?? [];
  const groups = groupsQuery.data ?? [];

  const groupName = (id: string) => groups.find((g) => g.id === id)?.groupName ?? id.slice(0, 8);

  const canApproveGroup = (gid: string) => {
    const g = groups.find((x) => x.id === gid);
    if (!g || !userId) return false;
    return g.mainApprovalUser === userId || g.tempApprovalUser === userId;
  };

  const counts = useMemo(() => {
    const c = { all: vacations.length, pending: 0, approved: 0, rejected: 0, mine: 0 };
    for (const v of vacations) {
      c[vacationStatus(v)]++;
      if (v.userId === userId) c.mine++;
    }
    return c;
  }, [vacations, userId]);

  const filtered = useMemo(() => {
    if (filter === "all") return vacations;
    if (filter === "mine") return vacations.filter((v) => v.userId === userId);
    return vacations.filter((v) => vacationStatus(v) === filter);
  }, [vacations, filter, userId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Requests</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Review and approve vacation requests for the selected month.
          </p>
        </div>
        <MonthPicker
          year={year}
          month={month}
          onChange={(y, m) => {
            setYear(y);
            setMonth(m);
          }}
        />
      </div>

      <div className="border-border flex flex-wrap gap-1 border-b pb-0">
        {(["all", "mine", "pending", "approved", "rejected"] as Filter[]).map((f) => (
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

      {vacationsQuery.isLoading ? (
        <div className="text-muted-foreground py-16 text-center text-sm">Loading…</div>
      ) : vacationsQuery.error ? (
        <div className="text-destructive py-16 text-center text-sm">
          {vacationsQuery.error.message}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-muted-foreground py-16 text-center text-sm">
          No requests in this month
          {filter !== "all" ? ` (${filter})` : ""}.
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => {
                const status = vacationStatus(v);
                const mine = v.userId === userId;
                return (
                  <TableRow
                    key={v.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open request details for ${formatDate(v.requestedDay)}`}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => openDetail(v.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openDetail(v.id);
                      }
                    }}
                  >
                    <TableCell className="text-sm">
                      <div className="font-medium">{groupName(v.groupId)}</div>
                      <div className="text-muted-foreground text-xs">
                        {mine ? "You" : v.user.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          VACATION_KIND_COLORS[v.vacationType]
                        )}
                      >
                        {VACATION_KIND_LABELS[v.vacationType]}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(v.requestedDay)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {v.startTime && v.endTime
                        ? `${v.startTime.slice(0, 5)} – ${v.endTime.slice(0, 5)}`
                        : "Full day"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          STATUS_BADGE[status]
                        )}
                      >
                        {status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {/* The row itself opens the detail dialog; the inline
                          actions must not trigger it as well. */}
                      <div
                        className="flex justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                        role="presentation"
                      >
                        {status === "pending" && canApproveGroup(v.groupId) ? (
                          <>
                            <Button
                              size="xs"
                              variant="outline"
                              className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/30"
                              disabled={isMutating}
                              onClick={() => approve.mutate(v.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                              disabled={isMutating}
                              onClick={() => reject.mutate({ id: v.id })}
                            >
                              Reject
                            </Button>
                          </>
                        ) : null}
                        {/* Approved days can be cancelled too — plans change. */}
                        {mine ? (
                          <Button
                            size="xs"
                            variant="ghost"
                            disabled={isMutating}
                            onClick={() => cancel.mutate(v.id)}
                          >
                            Cancel
                          </Button>
                        ) : null}
                        {status !== "pending" && !mine ? (
                          <span className="text-muted-foreground text-xs">—</span>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <VacationDetailDialog
        vacationId={selectedId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
