"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUsd } from "@/lib/api/ai-settings";
import { REFUSED_WARNING, type AiUsage, type AiUsageWeek } from "@/lib/api/ai-usage";
import { useAiUsageWeek } from "@/lib/api/ai-usage-queries";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";
import { dateTimeLabel, weekLabel } from "./usage-format";

/** Past weeks newest first; a week opens to its per-person split, or says only the total is kept. */
export function PastWeeks({ usage }: { usage: AiUsage }) {
  const { t, locale } = useTranslation();
  const copy = t.aiUsage.weeks;
  const [open, setOpen] = useState<string | null>(null);
  const limit = Math.max(usage.assistant.limitMicroUsd, 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          {copy.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {usage.assistant.weeks.length === 0 ? (
          <p className="text-muted-foreground text-sm">{copy.empty}</p>
        ) : (
          <>
            <ul aria-label={copy.title}>
              {usage.assistant.weeks.map((week) => {
                const isOpen = open === week.weekStart;
                const label = weekLabel(week.weekStart, t.common.dateLocale);
                return (
                  <li key={week.weekStart} className="border-b last:border-0">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? null : week.weekStart)}
                      className="hover:bg-muted/40 flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-md py-2.5 text-left text-sm"
                    >
                      {isOpen ? (
                        <ChevronDown className="text-muted-foreground size-4" aria-hidden />
                      ) : (
                        <ChevronRight className="text-muted-foreground size-4" aria-hidden />
                      )}
                      <span className="w-28 shrink-0">{label}</span>
                      <span className="hidden h-1.5 flex-1 rounded-full bg-[var(--surface-2)] sm:block">
                        <span
                          className={cn(
                            "block h-full rounded-full",
                            week.limitReachedAt ? "bg-destructive/80" : "bg-primary/60"
                          )}
                          style={{ width: `${Math.min(100, (week.usedMicroUsd / limit) * 100)}%` }}
                        />
                      </span>
                      <span className="ml-auto w-16 text-right tabular-nums sm:ml-0">
                        {formatUsd(locale, week.usedMicroUsd)}
                      </span>
                      {week.limitReachedAt ? (
                        <span className="text-muted-foreground w-full text-xs sm:w-44 sm:text-right">
                          {copy.limitReached(
                            dateTimeLabel(week.limitReachedAt, t.common.dateLocale, false)
                          )}
                        </span>
                      ) : (
                        <span className="hidden w-44 sm:block" />
                      )}
                    </button>
                    {isOpen ? (
                      <div className="pb-3 pl-7">
                        <WeekPeople organizationId={usage.organizationId} week={week} />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <p className="text-muted-foreground pt-2 text-xs">{copy.kept}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function WeekPeople({ organizationId, week }: { organizationId: string; week: AiUsageWeek }) {
  const { t, locale } = useTranslation();
  const copy = t.aiUsage;
  const query = useAiUsageWeek(organizationId, week.weekStart, week.perPerson);

  if (!week.perPerson) {
    return <p className="text-muted-foreground text-sm">{copy.weeks.totalOnly}</p>;
  }
  if (query.isPending) {
    return <p className="text-muted-foreground text-sm">{t.common.loading}</p>;
  }
  if (query.isError) {
    return <p className="text-destructive text-sm">{copy.weeks.loadFailed}</p>;
  }
  const people = query.data.people ?? [];
  if (people.length === 0) {
    return <p className="text-muted-foreground text-sm">{copy.weeks.noOne}</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-muted-foreground border-b text-left">
          <th className="py-2 font-medium">{copy.people.person}</th>
          <th className="py-2 text-right font-medium">{copy.weeks.spend}</th>
          <th className="py-2 pl-4 text-right font-medium" title={copy.people.refusedHint}>
            {copy.people.refused}
          </th>
        </tr>
      </thead>
      <tbody>
        {people.map((person) => (
          <tr key={person.userId ?? "deleted"} className="border-b last:border-0">
            <td className={cn("py-2", person.name === null && "text-muted-foreground italic")}>
              {person.name ?? copy.people.deletedAccount}
            </td>
            <td className="py-2 text-right tabular-nums">
              {formatUsd(locale, person.assistantMicroUsd)}
            </td>
            <td
              className={cn(
                "py-2 pl-4 text-right tabular-nums",
                person.refusedTurns >= REFUSED_WARNING &&
                  "font-semibold text-amber-700 dark:text-amber-400"
              )}
            >
              {person.refusedTurns}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
