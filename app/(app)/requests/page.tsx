"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  useApproveVacations,
  useCancelVacations,
  useGroups,
  useRejectVacations,
  useReportScope,
  useVacations,
} from "@/lib/api/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/lib/auth-client";
import {
  CALENDAR_RECORD_TYPE_COLORS,
  type VacationListItem,
  type VacationStatus,
} from "@/lib/api/types";
import { groupVacationRequests } from "@/lib/vacations/group-requests";
import { dayLengthLabel } from "@/lib/vacations/day-length";
import { useOpenVacationDetail } from "@/lib/vacations/use-vacation-detail";
import { vacationActionErrorMessage, type VacationAction } from "@/lib/vacations/action-error";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";

type Filter = "all" | VacationStatus | "mine";

/** Sentinel for "drop the group scope" — Select cannot carry a null value. */
const MINE_SCOPE = "__mine__";

const STATUS_BADGE: Record<VacationStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  cancelled: "bg-muted text-muted-foreground",
};

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateRange(from: string, to: string, locale: string) {
  const start = formatDate(from, locale);
  return from === to ? start : `${start} – ${formatDate(to, locale)}`;
}

function MonthPicker({
  year,
  month,
  onChange,
  months,
}: {
  year: number;
  month: number;
  onChange: (y: number, m: number) => void;
  months: string[];
}) {
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
  const { t } = useTranslation();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [filter, setFilter] = useState<Filter>("all");

  // The detail dialog lives in the app layout, keyed off `?vacationId=` — the
  // same query notification emails deep-link here with.
  const { openVacation } = useOpenVacationDetail();

  const { data: session } = useSession();
  const userId = session?.user?.id;

  const groupsQuery = useGroups();
  // Without a group scope the endpoint returns the caller's own rows only.
  const reportScopeQuery = useReportScope();
  const viewableGroups = useMemo(
    () => (reportScopeQuery.data?.groups ?? []).filter((g) => g.access === "all"),
    [reportScopeQuery.data]
  );

  const [scopeOverride, setScopeOverride] = useState<string | null>(null);
  const scopeGroupId =
    scopeOverride === MINE_SCOPE
      ? null
      : (viewableGroups.find((g) => g.groupId === scopeOverride)?.groupId ??
        viewableGroups[0]?.groupId ??
        null);

  // Cancelled rows stay visible here (with who cancelled them on the detail);
  // the calendar and dashboard keep their live-rows-only view.
  const vacationsQuery = useVacations({
    year,
    month,
    groupId: scopeGroupId,
    includeCancelled: true,
  });
  const approve = useApproveVacations();
  const reject = useRejectVacations();
  const cancel = useCancelVacations();
  const isMutating = approve.isPending || reject.isPending || cancel.isPending;

  const [actionError, setActionError] = useState<string | null>(null);
  const actionCallbacks = (action: VacationAction) => ({
    onSuccess: () => setActionError(null),
    onError: (err: Error) => setActionError(vacationActionErrorMessage(err, action, t)),
  });

  // The button that failed can be far down a long month, so bring the message
  // into view rather than leaving the click looking ignored.
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (actionError) errorRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [actionError]);

  const vacations = useMemo<VacationListItem[]>(
    () => vacationsQuery.data ?? [],
    [vacationsQuery.data]
  );
  const groups = groupsQuery.data ?? [];

  const requests = useMemo(() => groupVacationRequests(vacations), [vacations]);

  const groupName = (id: string) => groups.find((g) => g.id === id)?.groupName ?? id.slice(0, 8);

  const counts = useMemo(() => {
    const c = { all: requests.length, pending: 0, approved: 0, rejected: 0, cancelled: 0, mine: 0 };
    for (const r of requests) {
      c[r.status]++;
      if (r.userId === userId) c.mine++;
    }
    return c;
  }, [requests, userId]);

  const filtered = useMemo(() => {
    if (filter === "all") return requests;
    if (filter === "mine") return requests.filter((r) => r.userId === userId);
    return requests.filter((r) => r.status === filter);
  }, [requests, filter, userId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t.requests.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.requests.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {viewableGroups.length > 0 ? (
            <Select
              value={scopeGroupId ?? MINE_SCOPE}
              onValueChange={(value) => {
                setScopeOverride(value);
                setActionError(null);
              }}
            >
              <SelectTrigger size="sm" className="w-[190px]" aria-label={t.requests.scopeLabel}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {viewableGroups.map((group) => (
                  <SelectItem key={group.groupId} value={group.groupId}>
                    {group.groupName}
                  </SelectItem>
                ))}
                <SelectItem value={MINE_SCOPE}>{t.requests.scopeMine}</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
          <MonthPicker
            year={year}
            month={month}
            months={t.calendar.monthsShort}
            onChange={(y, m) => {
              setYear(y);
              setMonth(m);
              setActionError(null);
            }}
          />
        </div>
      </div>

      <div className="border-border flex flex-wrap gap-1 border-b pb-0">
        {(["all", "mine", "pending", "approved", "rejected", "cancelled"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setActionError(null);
            }}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium capitalize transition-colors",
              filter === f
                ? "border-primary text-primary"
                : "text-muted-foreground hover:text-foreground border-transparent"
            )}
          >
            {t.requests.filters[f]}
            <span className="bg-muted text-muted-foreground ml-1.5 rounded-full px-1.5 py-0.5 text-xs">
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {actionError ? (
        <div
          ref={errorRef}
          role="alert"
          className="bg-destructive/10 text-destructive border-destructive/30 rounded-2xl border px-3 py-2 text-sm"
        >
          {actionError}
        </div>
      ) : null}

      {vacationsQuery.isLoading ? (
        <div className="text-muted-foreground py-16 text-center text-sm">{t.common.loading}</div>
      ) : vacationsQuery.error ? (
        <div className="text-destructive py-16 text-center text-sm">
          {vacationsQuery.error.message}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-muted-foreground py-16 text-center text-sm">
          {filter !== "all"
            ? t.requests.emptyFiltered(t.requests.filters[filter])
            : `${t.requests.empty}.`}
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.requests.columns.group}</TableHead>
                <TableHead>{t.requests.columns.type}</TableHead>
                <TableHead>{t.requests.columns.day}</TableHead>
                <TableHead>{t.requests.columns.time}</TableHead>
                <TableHead>{t.requests.columns.status}</TableHead>
                <TableHead className="text-right">{t.requests.columns.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const status = r.status;
                const mine = r.userId === userId;
                const dateLabel = formatDateRange(r.from, r.to, t.common.dateLocale);
                return (
                  <TableRow
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    aria-label={t.requests.openDetails(dateLabel)}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => openVacation(r.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openVacation(r.id);
                      }
                    }}
                  >
                    <TableCell className="text-sm">
                      <div className="font-medium">{groupName(r.groupId)}</div>
                      <div className="text-muted-foreground text-xs">
                        {mine ? t.requests.you : r.user.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          CALENDAR_RECORD_TYPE_COLORS[r.vacationType]
                        )}
                      >
                        {t.calendarRecordTypes[r.vacationType].label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {dateLabel}
                      {r.dayCount > 1 ? (
                        <span className="text-muted-foreground ml-1.5 text-xs">
                          {t.requests.dayCount(r.dayCount)}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {dayLengthLabel(r, {
                        halfDay: t.common.halfDay,
                        fullDay: t.common.fullDay,
                      })}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          STATUS_BADGE[status]
                        )}
                      >
                        {t.status[status]}
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
                        {status === "pending" && r.canApprove ? (
                          <>
                            <Button
                              size="xs"
                              variant="outline"
                              className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/30"
                              disabled={isMutating}
                              onClick={() =>
                                approve.mutate(r.vacationIds, actionCallbacks("approve"))
                              }
                            >
                              {t.requests.approve}
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                              disabled={isMutating}
                              onClick={() =>
                                reject.mutate({ ids: r.vacationIds }, actionCallbacks("reject"))
                              }
                            >
                              {t.requests.reject}
                            </Button>
                          </>
                        ) : null}
                        {/* Approved days can be cancelled too — plans change. */}
                        {mine && status !== "cancelled" ? (
                          <Button
                            size="xs"
                            variant="ghost"
                            disabled={isMutating}
                            onClick={() =>
                              cancel.mutate({ ids: r.vacationIds }, actionCallbacks("cancel"))
                            }
                          >
                            {t.requests.cancel}
                          </Button>
                        ) : null}
                        {status === "cancelled" || (status !== "pending" && !mine) ? (
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
    </div>
  );
}
