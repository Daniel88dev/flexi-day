"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AvatarBubble } from "@/components/brand/avatar-bubble";
import { ReportFiltersBar } from "@/components/report/report-filters";
import { MemberQuotaChart } from "@/components/report/member-quota-chart";
import { UsageTable } from "@/components/report/usage-table";
import { ExportDialog } from "@/components/report/export-dialog";
import { useReportOverview, useReportScope } from "@/lib/api/queries";
import { buildMemberCards, formatDays } from "@/lib/report/series";
import type { ReportFilters } from "@/lib/api/report-types";
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
            {cards.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t.report.charts.empty}</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {cards.map((card) => (
                  <Card key={`${card.member.id}-${card.vacationType}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <AvatarBubble
                          name={card.member.name}
                          initials={card.member.initials}
                          background={card.member.avatarColor}
                          size={26}
                        />
                        <Link
                          href={`/report/member?userId=${encodeURIComponent(card.member.id)}&year=${String(filters.year)}`}
                          className="hover:underline"
                        >
                          {card.member.name}
                        </Link>
                        <span className="text-muted-foreground ml-auto text-xs font-normal">
                          {t.leaveTypes[card.vacationType].label}{" "}
                          <span className={card.remaining < 0 ? "text-destructive" : undefined}>
                            {formatDays(card.remaining)}
                          </span>{" "}
                          / {formatDays(card.quota)}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MemberQuotaChart series={card.series} quota={card.quota} />
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
