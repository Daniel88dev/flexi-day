"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ReportFiltersBar } from "@/components/report/report-filters";
import { TeamUsageChart } from "@/components/report/team-usage-chart";
import { TeamRemainingChart } from "@/components/report/team-remaining-chart";
import { UsageTable } from "@/components/report/usage-table";
import { ExportDialog } from "@/components/report/export-dialog";
import { useReportOverview, useReportScope } from "@/lib/api/queries";
import {
  activeLeaveTypes,
  buildMemberCards,
  buildMemberRemaining,
  buildTeamMonthlySeries,
  calendarMonths,
  formatDays,
  trailingMonths,
  windowLabel,
  withYear,
  yearsInWindow,
} from "@/lib/report/series";
import { assignMemberColors, LEAVE_TYPE_CHART_COLORS } from "@/lib/report/colors";
import type { ReportFilters, ReportPeriod, ReportScopeMember } from "@/lib/api/report-types";
import { useTranslation } from "@/lib/i18n/use-translation";

export default function ReportPage() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const [period, setPeriod] = useState<ReportPeriod>("rolling");
  const [filters, setFilters] = useState<ReportFilters>({ year: currentYear });

  const slots = useMemo(
    () => (period === "rolling" ? trailingMonths(new Date()) : calendarMonths(period)),
    [period]
  );

  const scopeQuery = useReportScope();
  const overviewQuery = useReportOverview(filters);

  // A trailing window reaches back into last year, and the endpoint is
  // year-scoped, so that year is a second fetch — skipped when it holds no data.
  const priorYear = yearsInWindow(slots)[0];
  const needsPriorYear =
    priorYear !== filters.year && (scopeQuery.data?.years ?? []).includes(priorYear);
  const priorQuery = useReportOverview({ ...filters, year: priorYear }, needsPriorYear);

  const overview = overviewQuery.data;
  // Not `priorQuery.data`: a disabled query still hands back whatever the cache
  // holds for its key, which is the very year already in `overview`.
  const prior = needsPriorYear ? priorQuery.data : undefined;

  // Both halves of a cross-year window have to be in before the charts mean
  // anything: drawn early, last year's months are zeros that read as "nobody
  // took leave" and then jump when the second fetch lands. Which years are
  // even worth fetching is not known until scope resolves, so that counts too.
  const spansYears = yearsInWindow(slots).length > 1;
  const windowPending =
    spansYears && (scopeQuery.isPending || (needsPriorYear && priorQuery.isPending));
  const windowIncomplete = needsPriorYear && priorQuery.isError;

  const usage = useMemo(
    () => [
      ...(prior ? withYear(prior.year, prior.monthly) : []),
      ...(overview ? withYear(overview.year, overview.monthly) : []),
    ],
    [overview, prior]
  );

  const cards = useMemo(
    () => (overview ? buildMemberCards(overview.members, overview.summary, filters.types) : []),
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

  const leaveTypes = useMemo(
    () => (overview ? activeLeaveTypes(overview.summary, filters.types) : []),
    [overview, filters.types]
  );

  /**
   * Usage then days-left for one leave type before moving on to the next, so
   * the two views of the same allowance sit together.
   */
  const panels = useMemo(() => {
    if (!overview || chartMembers.length === 0) return [];
    const memberIds = chartMembers.map((member) => member.id);

    return leaveTypes.flatMap((type, index) => {
      const label = t.leaveTypes[type].label;
      const series = buildTeamMonthlySeries(usage, memberIds, type, slots);
      const total = series.reduce(
        (sum, row) => sum + memberIds.reduce((rowSum, id) => rowSum + row[id], 0),
        0
      );

      return [
        {
          id: `usage-${type}`,
          // Only the leading panel opens itself; everything else is one click
          // away, so the page does not land as a wall of charts.
          openByDefault: index === 0,
          title: t.report.charts.usageSection(label),
          hint: windowLabel(slots, t.calendar.monthsShort),
          meta: `${t.report.charts.total}: ${formatDays(Number(total.toFixed(2)))}`,
          body: <TeamUsageChart members={chartMembers} series={series} colors={memberColors} />,
        },
        {
          id: `remaining-${type}`,
          openByDefault: false,
          title: t.report.charts.remainingSection(label),
          hint: t.report.charts.remainingSubtitle(filters.year),
          meta: null,
          body: (
            <TeamRemainingChart
              remaining={buildMemberRemaining(chartMembers, overview.summary, type)}
              year={filters.year}
              color={LEAVE_TYPE_CHART_COLORS[type]}
            />
          ),
        },
      ];
    });
  }, [overview, chartMembers, leaveTypes, usage, slots, memberColors, filters.year, t]);

  // Remounts the accordion when the set of panels changes, so a filter that
  // swaps leave types lands on "usage open, days-left closed" again instead of
  // carrying a stale selection.
  const defaultOpen = useMemo(
    () => panels.filter((panel) => panel.openByDefault).map((panel) => panel.id),
    [panels]
  );

  const hasScope = (scopeQuery.data?.groups.length ?? 0) > 0;

  const changePeriod = (next: ReportPeriod) => {
    setPeriod(next);
    setFilters((current) => ({ ...current, year: next === "rolling" ? currentYear : next }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t.report.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.report.subtitle}</p>
        </div>
        <ExportDialog scope={scopeQuery.data} filters={filters} />
      </div>

      <ReportFiltersBar
        scope={scopeQuery.data}
        filters={filters}
        onChange={setFilters}
        period={period}
        onPeriodChange={changePeriod}
      />

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
          {windowPending ? (
            <p className="text-muted-foreground text-sm">{t.common.loading}</p>
          ) : panels.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t.report.charts.empty}</p>
          ) : (
            <>
              {windowIncomplete ? (
                <p role="status" className="text-muted-foreground pb-3 text-sm">
                  {t.report.charts.windowIncomplete(priorYear)}
                </p>
              ) : null}
              <Accordion
                type="multiple"
                key={defaultOpen.join("|")}
                defaultValue={defaultOpen}
                className="space-y-4"
              >
                {panels.map((panel) => (
                  <AccordionItem key={panel.id} value={panel.id} asChild>
                    <Card className="gap-3">
                      <AccordionTrigger className="px-(--card-spacing)">
                        <span className="flex flex-wrap items-baseline gap-2">
                          <span className="font-heading text-base font-medium">{panel.title}</span>
                          <span className="text-muted-foreground text-xs font-normal">
                            {panel.hint}
                          </span>
                        </span>
                        {panel.meta ? (
                          <span className="text-muted-foreground ml-auto text-xs font-normal">
                            {panel.meta}
                          </span>
                        ) : null}
                      </AccordionTrigger>
                      <AccordionContent>
                        <CardContent>{panel.body}</CardContent>
                      </AccordionContent>
                    </Card>
                  </AccordionItem>
                ))}
              </Accordion>
            </>
          )}

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold">{t.report.table.title}</h2>
            <Card>
              <CardContent className="p-0">
                <UsageTable cards={cards} year={filters.year} period={period} />
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
