"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Pencil } from "lucide-react";
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
import { memberReportQuery, useMemberReport } from "@/lib/api/queries";
import { useReportWindow } from "@/hooks/use-report-window";
import {
  calendarMonths,
  formatDays,
  groupAllowance,
  monthlySeriesFor,
  totalQuotaFor,
  trailingMonths,
  windowLabel,
  withYear,
} from "@/lib/report/series";
import type { ReportScopeGroup } from "@/lib/api/report-types";
import type { CalendarRecordType } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import { recordTypeLabel } from "@/lib/i18n/record-type-label";

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
  const reportWindow = useReportWindow(slots, year, (priorYear) =>
    memberReportQuery(userId, priorYear)
  );

  const report = reportQuery.data;
  const prior = reportWindow.prior;

  const usage = useMemo(
    () => [
      ...(prior ? withYear(prior.year, prior.monthly) : []),
      ...(report ? withYear(report.year, report.monthly) : []),
    ],
    [report, prior]
  );

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
  const allowances: CalendarRecordType[] = [];
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

      {reportWindow.state === "incomplete" ? (
        <p role="status" className="text-muted-foreground text-sm">
          {t.report.charts.windowIncomplete(reportWindow.priorYear)}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {allowances.map((recordType) => (
            <Card key={recordType}>
              <CardHeader className="pb-2">
                <CardTitle className="flex flex-wrap items-baseline gap-2 text-base">
                  {t.report.charts.title} · {recordTypeLabel(t.calendarRecordTypes, recordType)}
                  <span className="text-muted-foreground text-xs font-normal">
                    {windowLabel(slots, t.calendar.monthsShort)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportWindow.state === "pending" ? (
                  <p className="text-muted-foreground text-sm">{t.common.loading}</p>
                ) : (
                  <MemberQuotaChart
                    series={monthlySeriesFor(usage, report.member.id, slots, [recordType])}
                    quota={totalQuotaFor(report.summary, report.member.id, recordType)}
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
              const allowance = groupAllowance(report.summary, report.member.id, group.groupId);
              return (
                <div key={group.groupId} className="space-y-2">
                  <span className="block text-sm font-medium">{group.groupName}</span>
                  <dl className="text-muted-foreground grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <dt>{t.report.table.carriedOver}</dt>
                    <dd className="text-foreground text-right tabular-nums">
                      {formatDays(allowance.carriedOverDays)}
                    </dd>
                    <dt>{t.report.table.yearQuota}</dt>
                    <dd className="text-foreground text-right tabular-nums">
                      {formatDays(allowance.vacationDays)}
                    </dd>
                    <dt>{t.report.quotaDialog.homeOfficeDays}</dt>
                    <dd className="text-foreground text-right tabular-nums">
                      {formatDays(allowance.homeOfficeDays)}
                    </dd>
                    {allowance.sickDays !== null ? (
                      <>
                        <dt>{t.report.quotaDialog.sickDays}</dt>
                        <dd className="text-foreground text-right tabular-nums">
                          {formatDays(allowance.sickDays)}
                        </dd>
                      </>
                    ) : null}
                  </dl>
                  {group.canEditQuotas && isCurrentYear ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setEditing(group)}
                    >
                      <Pencil data-icon="inline-start" />
                      {t.report.detail.editQuota}
                    </Button>
                  ) : null}
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
                      <TableCell>
                        {recordTypeLabel(t.calendarRecordTypes, booking.vacationType)}
                      </TableCell>
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
                      : change.actorDeleted
                        ? t.report.detail.byDeletedUser
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
