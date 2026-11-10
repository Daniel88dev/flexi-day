"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUsd } from "@/lib/api/ai-settings";
import { weekStartsBefore, type AiUsage } from "@/lib/api/ai-usage";
import { useAiUsage } from "@/lib/api/ai-usage-queries";
import { useOrganizations } from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";
import { PastWeeks } from "./past-weeks";
import { PeopleUsage } from "./people-usage";
import { dateTimeLabel, dayLabel, timeLabel, weekLabel, type UsageCopy } from "./usage-format";

/** Past weeks shown as bars beside this week. */
const BAR_WEEKS = 8;

/** The AI usage page: owner and org admins, one organization at a time. */
export function AiUsageScreen() {
  const { t } = useTranslation();
  const organizationsQuery = useOrganizations();
  const params = useSearchParams();
  const linkedId = params.get("organizationId");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const organizations = organizationsQuery.data ?? [];
  const linked = organizations.some((organization) => organization.id === linkedId)
    ? linkedId
    : null;
  const activeId = selectedId ?? linked ?? organizations[0]?.id ?? null;
  const usageQuery = useAiUsage(activeId);

  if (organizationsQuery.isLoading || (activeId && usageQuery.isLoading)) {
    return <p className="text-muted-foreground text-sm">{t.common.loading}</p>;
  }
  if (organizationsQuery.error || usageQuery.error || !usageQuery.data) {
    return (
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">{t.aiUsage.title}</h1>
        <p className="text-destructive text-sm">{t.aiUsage.loadFailed}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {organizations.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-xs font-semibold uppercase">
            {t.organization.switcher}
          </span>
          {organizations.map((organization) => (
            <button
              key={organization.id}
              type="button"
              aria-pressed={organization.id === activeId}
              onClick={() => setSelectedId(organization.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                organization.id === activeId
                  ? "border-primary text-primary bg-primary/5"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {organization.name}
            </button>
          ))}
        </div>
      ) : null}
      <UsageView key={usageQuery.data.organizationId} usage={usageQuery.data} />
    </div>
  );
}

function UsageView({ usage }: { usage: AiUsage }) {
  const { t } = useTranslation();
  const copy = t.aiUsage;
  const settingsHref = `/organization/?organizationId=${encodeURIComponent(usage.organizationId)}`;
  const assistantOn = usage.assistant.on;
  const connectionsOn = usage.aiConnections.on;

  if (!assistantOn && !connectionsOn) {
    return (
      <div className="space-y-3">
        <h1 className="font-heading text-2xl font-bold">{copy.title}</h1>
        <p className="text-muted-foreground text-sm">{copy.empty.body(usage.organizationName)}</p>
        <Button asChild size="sm" variant="outline">
          <Link href={settingsHref}>{copy.empty.action}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">{copy.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{copy.lead(usage.organizationName)}</p>
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link href={settingsHref}>{copy.settings}</Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card>
          <CardHeader>
            <CardTitle role="heading" aria-level={2}>
              {copy.assistant.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {assistantOn ? (
              <AssistantThisWeek usage={usage} copy={copy} />
            ) : (
              <p className="text-muted-foreground text-sm">{copy.assistant.off}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle role="heading" aria-level={2}>
              {copy.connections.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connectionsOn ? (
              <ConnectionsToday usage={usage} copy={copy} />
            ) : (
              <p className="text-muted-foreground text-sm">{copy.connections.off}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <PeopleUsage usage={usage} />

      {assistantOn ? <PastWeeks usage={usage} /> : null}
    </div>
  );
}

function AssistantThisWeek({ usage, copy }: { usage: AiUsage; copy: UsageCopy }) {
  const { t, locale } = useTranslation();
  const { assistant } = usage;
  const percent = Math.min(
    100,
    Math.round((assistant.usedMicroUsd / Math.max(assistant.limitMicroUsd, 1)) * 100)
  );
  const reached = assistant.reached;
  const until = dateTimeLabel(assistant.resetsAt, t.common.dateLocale, true);
  const byWeek = new Map(assistant.weeks.map((week) => [week.weekStart, week]));
  const bars = weekStartsBefore(assistant.weekStart, BAR_WEEKS).map((weekStart) => {
    const current = weekStart === assistant.weekStart;
    const week = byWeek.get(weekStart);
    return {
      weekStart,
      current,
      used: current ? assistant.usedMicroUsd : (week?.usedMicroUsd ?? 0),
      reached: current ? reached : (week?.limitReachedAt ?? null) !== null,
    };
  });
  const anyUsage = bars.some((bar) => bar.used > 0);

  return (
    <>
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            className="font-heading text-4xl font-bold tracking-tight tabular-nums"
            data-testid="ai-usage-used"
          >
            {formatUsd(locale, assistant.usedMicroUsd)}
          </span>
          <span className="text-muted-foreground text-sm">
            {copy.assistant.ofLimit(formatUsd(locale, assistant.limitMicroUsd), percent)}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={copy.assistant.title}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]"
        >
          <div
            className={cn("h-full rounded-full", reached ? "bg-destructive" : "bg-primary")}
            style={{ width: `${percent}%` }}
          />
        </div>
        {reached ? (
          <p className="text-sm">
            <span className="text-destructive font-semibold">{copy.assistant.reached}</span>{" "}
            {assistant.limitReachedAt
              ? copy.assistant.reachedOn(
                  dateTimeLabel(assistant.limitReachedAt, t.common.dateLocale, false),
                  until
                )
              : copy.assistant.pausedUntil(until)}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">{copy.assistant.resets(until)}</p>
        )}
      </div>
      {anyUsage ? (
        <div>
          <div className="flex h-24 items-end gap-2" role="list" aria-label={copy.assistant.chart}>
            {bars.map((bar) => {
              const label = bar.current
                ? copy.assistant.thisWeek
                : weekLabel(bar.weekStart, t.common.dateLocale);
              const amount = formatUsd(locale, bar.used);
              return (
                <div
                  key={bar.weekStart}
                  role="listitem"
                  className="flex h-full flex-1 flex-col justify-end"
                  aria-label={
                    bar.reached
                      ? copy.assistant.barReached(label, amount)
                      : copy.assistant.bar(label, amount)
                  }
                  title={
                    bar.reached
                      ? copy.assistant.barReached(label, amount)
                      : copy.assistant.bar(label, amount)
                  }
                >
                  <div
                    className={cn(
                      "w-full rounded-sm",
                      bar.reached
                        ? "bg-destructive/80"
                        : bar.current
                          ? "bg-primary"
                          : "bg-primary/35"
                    )}
                    style={{
                      height: `${Math.max(2, Math.min(100, (bar.used / Math.max(assistant.limitMicroUsd, 1)) * 100))}%`,
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="text-muted-foreground mt-1.5 flex justify-between text-xs">
            <span>{weekLabel(bars[0]!.weekStart, t.common.dateLocale)}</span>
            <span>{copy.assistant.thisWeek}</span>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ConnectionsToday({ usage, copy }: { usage: AiUsage; copy: UsageCopy }) {
  const { t } = useTranslation();
  const { aiConnections } = usage;
  const count = new Intl.NumberFormat(t.common.dateLocale);
  const max = Math.max(aiConnections.dailyLimit, ...aiConnections.days.map((day) => day.calls), 1);
  const lastReached = [...aiConnections.days].reverse().find((day) => day.limitReachedAt);
  const anyCalls = aiConnections.days.some((day) => day.calls > 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span
          className="font-heading text-2xl font-bold tabular-nums"
          data-testid="ai-usage-calls-today"
        >
          {count.format(aiConnections.callsToday)}
        </span>
        <span className="text-muted-foreground text-sm">
          {copy.connections.ofLimit(
            count.format(aiConnections.dailyLimit),
            timeLabel(aiConnections.resetsAt, t.common.dateLocale)
          )}
        </span>
      </div>
      {anyCalls ? (
        <div>
          <div
            className="flex h-28 items-end gap-1.5"
            role="list"
            aria-label={copy.connections.chart}
          >
            {aiConnections.days.map((day, index) => {
              const today = index === aiConnections.days.length - 1;
              const label = today ? copy.connections.today : dayLabel(day.day, t.common.dateLocale);
              const text = day.limitReachedAt
                ? copy.connections.dayReached(label)
                : copy.connections.bar(label, count.format(day.calls));
              return (
                <div
                  key={day.day}
                  role="listitem"
                  aria-label={text}
                  title={text}
                  className="flex h-full flex-1 flex-col justify-end"
                >
                  <div
                    className={cn(
                      "w-full rounded-sm",
                      day.limitReachedAt
                        ? "bg-destructive/80"
                        : today
                          ? "bg-primary"
                          : "bg-primary/35"
                    )}
                    style={{ height: `${Math.max(2, (day.calls / max) * 100)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="text-muted-foreground mt-1.5 flex justify-between gap-2 text-xs">
            <span>{dayLabel(aiConnections.days[0]!.day, t.common.dateLocale)}</span>
            {lastReached ? (
              <span className="text-destructive">
                {copy.connections.dayReached(dayLabel(lastReached.day, t.common.dateLocale))}
              </span>
            ) : null}
            <span>{copy.connections.today}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
