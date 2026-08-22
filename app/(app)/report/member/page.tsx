"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AvatarBubble } from "@/components/brand/avatar-bubble";
import { MemberQuotaChart } from "@/components/report/member-quota-chart";
import { QuotaEditDialog } from "@/components/report/quota-edit-dialog";
import { useMemberReport, useReportScope } from "@/lib/api/queries";
import {
  calendarMonths,
  formatDays,
  monthlySeriesFor,
  totalQuotaFor,
  trailingMonths,
  windowLabel,
  withYear,
  yearsInWindow,
} from "@/lib/report/series";
import type { ReportScopeGroup } from "@/lib/api/report-types";
import { VACATION_KIND_LABELS, type VacationKind } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";

export default function MemberReportPage() {
  const { t } = useTranslation();
  const search = useSearchParams();
  const userId = search.get("userId") ?? "";
  const year = Number(search.get("year")) || new Date().getFullYear();

  const [editing, setEditing] = useState<ReportScopeGroup | null>(null);

  // Quotas are settled once a year is over and there is nothing to carry over
  // from yet in a future one, so only the current year is editable here.
  const isCurrentYear = year === new Date().getFullYear();

  // The window the report was showing when this member was clicked, so the two
  // charts cover the same months. Without it, a past year is shown whole and
  // the current year rolls, which is what the report itself defaults to.
  const period = search.get("period");
  const rolling = period === null ? isCurrentYear : period === "rolling";
  const slots = useMemo(
    () => (rolling ? trailingMonths(new Date()) : calendarMonths(year)),
    [rolling, year]
  );

  const reportQuery = useMemberReport(userId, year);
  const scopeQuery = useReportScope();

  const priorYear = yearsInWindow(slots)[0];
  const needsPriorYear = priorYear !== year && (scopeQuery.data?.years ?? []).includes(priorYear);
  const priorQuery = useMemberReport(userId, priorYear, needsPriorYear);

  const report = reportQuery.data;
  // Not `priorQuery.data`: a disabled query still hands back whatever the cache
  // holds for its key, which is the very year already in `report`.
  const prior = needsPriorYear ? priorQuery.data : undefined;

  const usage = useMemo(
    () => [
      ...(prior ? withYear(prior.year, prior.monthly) : []),
      ...(report ? withYear(report.year, report.monthly) : []),
    ],
    [report, prior]
  );

  // A cross-year window is only complete once scope has said which years hold
  // data and the second year has landed; drawing earlier shows last year's
  // months as zeros that then jump.
  const spansYears = yearsInWindow(slots).length > 1;
  const windowPending =
    spansYears && (scopeQuery.isPending || (needsPriorYear && priorQuery.isPending));
  // A failed scope leaves `needsPriorYear` false, which would quietly drop last
  // year's half rather than admit it never looked.
  const windowIncomplete =
    (needsPriorYear && priorQuery.isError) || (spansYears && scopeQuery.isError);

  if (reportQuery.isPending) {
    return <p className="text-muted-foreground text-sm">{t.common.loading}</p>;
  }

  if (reportQuery.isError || !report) {
    return (
      <div className="space-y-4">
        <Link href="/report" className="text-muted-foreground text-sm hover:underline">
          {t.report.detail.back}
        </Link>
        <p className="text-destructive text-sm">
          {reportQuery.error instanceof Error ? reportQuery.error.message : t.report.export.failed}
        </p>
      </div>
    );
  }

  // One chart per allowance; they are independent budgets and must not merge.
  const allowances: VacationKind[] = [];
  for (const row of report.summary) {
    if (!allowances.includes(row.vacationType)) allowances.push(row.vacationType);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground text-xs">
          <Link href="/report" className="hover:text-foreground hover:underline">
            {t.report.detail.back}
          </Link>
        </p>
        <div className="mt-1 flex items-center gap-3">
          <AvatarBubble
            name={report.member.name}
            initials={report.member.initials}
            background={report.member.avatarColor}
            size={38}
          />
          <div>
            <h1 className="font-heading text-2xl font-bold">{report.member.name}</h1>
            <p className="text-muted-foreground text-sm">{year}</p>
          </div>
        </div>
      </div>

      {windowIncomplete ? (
        <p role="status" className="text-muted-foreground text-sm">
          {t.report.charts.windowIncomplete(priorYear)}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {allowances.map((leaveType) => (
            <Card key={leaveType}>
              <CardHeader className="pb-2">
                <CardTitle className="flex flex-wrap items-baseline gap-2 text-base">
                  {t.report.charts.title} · {t.leaveTypes[leaveType].label}
                  <span className="text-muted-foreground text-xs font-normal">
                    {windowLabel(slots, t.calendar.monthsShort)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {windowPending ? (
                  <p className="text-muted-foreground text-sm">{t.common.loading}</p>
                ) : (
                  <MemberQuotaChart
                    series={monthlySeriesFor(usage, report.member.id, slots, [leaveType])}
                    quota={totalQuotaFor(report.summary, report.member.id, leaveType)}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t.report.table.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.groups.map((group) => {
              const groupQuota = report.quotas.find((row) => row.groupId === group.groupId);
              return (
                <div key={group.groupId} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{group.groupName}</span>
                    {group.canEditQuotas && isCurrentYear ? (
                      <Button variant="ghost" size="xs" onClick={() => setEditing(group)}>
                        {t.report.detail.editQuota}
                      </Button>
                    ) : null}
                  </div>
                  <dl className="text-muted-foreground grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <dt>{t.report.table.carriedOver}</dt>
                    <dd className="text-foreground text-right tabular-nums">
                      {formatDays(groupQuota?.carriedOverDays ?? 0)}
                    </dd>
                    <dt>{t.report.table.yearQuota}</dt>
                    <dd className="text-foreground text-right tabular-nums">
                      {formatDays(groupQuota?.vacationDays ?? 0)}
                    </dd>
                    <dt>{t.report.quotaDialog.homeOfficeDays}</dt>
                    <dd className="text-foreground text-right tabular-nums">
                      {formatDays(groupQuota?.homeOfficeDays ?? 0)}
                    </dd>
                  </dl>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t.report.detail.bookings}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {report.bookings.length === 0 ? (
            <p className="text-muted-foreground px-6 py-8 text-center text-sm">
              {t.report.detail.bookingsEmpty}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.report.table.type}</TableHead>
                    <TableHead>{t.report.table.group}</TableHead>
                    <TableHead>{t.report.detail.range}</TableHead>
                    <TableHead className="text-right">{t.report.detail.days}</TableHead>
                    <TableHead>{t.report.detail.status}</TableHead>
                    <TableHead>{t.report.detail.note}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.bookings.map((booking) => (
                    <TableRow key={`${booking.groupId}-${booking.from}-${booking.vacationType}`}>
                      <TableCell>{VACATION_KIND_LABELS[booking.vacationType]}</TableCell>
                      <TableCell>{booking.groupName}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {booking.from === booking.to
                          ? booking.from
                          : `${booking.from} – ${booking.to}`}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatDays(booking.days)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{t.report.detail.statuses[booking.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[240px] truncate">
                        {booking.note ?? ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t.report.detail.changes}</CardTitle>
        </CardHeader>
        <CardContent>
          {report.changes.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              {t.report.detail.changesEmpty}
            </p>
          ) : (
            <ol className="space-y-3">
              {report.changes.map((change) => (
                <li key={change.id} className="border-border border-l-2 pl-3 text-sm">
                  <p>{change.changeDetail}</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(change.createdAt).toLocaleString(t.common.dateLocale)}
                    {" · "}
                    {change.actor
                      ? t.report.detail.by(change.actor.name)
                      : t.report.detail.bySystem}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {editing ? (
        <QuotaEditDialog
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          userId={report.member.id}
          year={year}
          group={editing}
          quota={report.quotas.find((row) => row.groupId === editing.groupId)}
        />
      ) : null}
    </div>
  );
}
