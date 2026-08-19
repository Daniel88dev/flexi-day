"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportFiltersBar } from "@/components/report/report-filters";
import { TeamUsageChart } from "@/components/report/team-usage-chart";
import { UsageTable } from "@/components/report/usage-table";
import { ExportDialog } from "@/components/report/export-dialog";
import { useReportOverview, useReportScope } from "@/lib/api/queries";
import {
  activeLeaveTypes,
  buildMemberCards,
  buildTeamMonthlySeries,
  formatDays,
} from "@/lib/report/series";
import { assignMemberColors } from "@/lib/report/colors";
import type { ReportFilters, ReportScopeMember } from "@/lib/api/report-types";
import { useTranslation } from "@/lib/i18n/use-translation";

export default function ReportPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<ReportFilters>({ year: new Date().getFullYear() });

  const scopeQuery = useReportScope();
  const overviewQuery = useReportOverview(filters);

  const overview = overviewQuery.data;

  const cards = useMemo(
    () =>
      overview
        ? buildMemberCards(overview.members, overview.monthly, overview.summary, filters.types)
        : [],
    [overview, filters.types]
  );

  const chartMembers = useMemo(() => {
    const byId = new Map<string, ReportScopeMember>();
    for (const member of overview?.members ?? []) {
      if (!byId.has(member.id)) byId.set(member.id, member);
    }
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [overview]);

  const memberColors = useMemo(() => assignMemberColors(overview?.members ?? []), [overview]);

  const teamCharts = useMemo(() => {
    if (!overview || chartMembers.length === 0) return [];
    const memberIds = chartMembers.map((member) => member.id);
    return activeLeaveTypes(overview.summary, filters.types).map((type) => {
      const series = buildTeamMonthlySeries(overview.monthly, memberIds, type);
      const total = series.reduce(
        (sum, row) => sum + memberIds.reduce((rowSum, id) => rowSum + row[id], 0),
        0
      );
      return { type, series, total: Number(total.toFixed(2)) };
    });
  }, [overview, chartMembers, filters.types]);

  const hasScope = (scopeQuery.data?.groups.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t.report.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.report.subtitle}</p>
        </div>
        <ExportDialog scope={scopeQuery.data} filters={filters} />
      </div>

      <ReportFiltersBar scope={scopeQuery.data} filters={filters} onChange={setFilters} />

      {overviewQuery.isPending ? (
        <p className="text-muted-foreground text-sm">{t.common.loading}</p>
      ) : !hasScope ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-medium">{t.report.empty.title}</p>
            <p className="text-muted-foreground mt-1 text-sm">{t.report.empty.body}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold">{t.report.charts.title}</h2>
            {teamCharts.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t.report.charts.empty}</p>
            ) : (
              <div className="space-y-4">
                {teamCharts.map(({ type, series, total }) => (
                  <Card key={type}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-baseline gap-2 text-base">
                        {t.leaveTypes[type].label}
                        <span className="text-muted-foreground ml-auto text-xs font-normal">
                          {t.report.charts.total}: {formatDays(total)}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TeamUsageChart
                        members={chartMembers}
                        series={series}
                        colors={memberColors}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold">{t.report.table.title}</h2>
            <Card>
              <CardContent className="p-0">
                <UsageTable cards={cards} year={filters.year} />
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
