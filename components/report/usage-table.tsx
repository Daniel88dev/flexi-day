"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AvatarBubble } from "@/components/brand/avatar-bubble";
import { formatDays, type MemberCard } from "@/lib/report/series";
import type { ReportPeriod } from "@/lib/api/report-types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";

type Props = {
  cards: MemberCard[];
  year: number;
  /**
   * Carried into the detail link so a member's chart covers the same months as
   * the team chart above it. Omitted by callers that have no period control.
   */
  period?: ReportPeriod;
};

export function UsageTable({ cards, year, period }: Props) {
  const { t } = useTranslation();

  if (cards.length === 0) {
    return <p className="text-muted-foreground py-8 text-center text-sm">{t.report.table.empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.report.table.member}</TableHead>
            <TableHead>{t.report.table.type}</TableHead>
            <TableHead className="text-right">{t.report.table.carriedOver}</TableHead>
            <TableHead className="text-right">{t.report.table.yearQuota}</TableHead>
            <TableHead className="text-right">{t.report.table.usedToDate}</TableHead>
            <TableHead className="text-right">{t.report.table.planned}</TableHead>
            <TableHead className="text-right">{t.report.table.pending}</TableHead>
            <TableHead className="text-right">{t.report.table.remaining}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cards.map((card) => (
            <TableRow key={`${card.member.id}-${card.vacationType}`}>
              <TableCell>
                <Link
                  href={`/report/member?userId=${encodeURIComponent(card.member.id)}&year=${String(year)}${period === undefined ? "" : `&period=${String(period)}`}`}
                  aria-label={t.report.table.openDetail(card.member.name)}
                  className="flex items-center gap-2 font-medium hover:underline"
                >
                  <AvatarBubble
                    name={card.member.name}
                    initials={card.member.initials}
                    background={card.member.avatarColor}
                    size={26}
                  />
                  {card.member.name}
                </Link>
              </TableCell>
              <TableCell className="text-sm whitespace-nowrap">
                {t.calendarRecordTypes[card.vacationType].label}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatDays(card.carriedOver)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatDays(card.yearQuota)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatDays(card.usedToDate)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatDays(card.plannedRemaining)}
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatDays(card.pending)}</TableCell>
              <TableCell
                className={cn(
                  "text-right font-medium tabular-nums",
                  card.remaining < 0 && "text-destructive"
                )}
              >
                {formatDays(card.remaining)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
