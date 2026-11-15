"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/api/ai-settings";
import { aiUsageHref } from "@/lib/api/ai-usage";
import {
  weeklyResetLabel,
  type AssistantOrganization,
  type WeeklyLimitState,
} from "@/lib/api/assistant";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * From 80% of the Weekly limit, under the composer: a bar at the true ratio and
 * the reset in the viewer's time zone. Owners and org admins also see the
 * amounts; members see the percentage only.
 */
export function NearLimit({
  organizationName,
  limit,
}: {
  organizationName: string;
  limit: WeeklyLimitState;
}) {
  const { t, locale } = useTranslation();
  const copy = t.assistant.limit;
  const reset = weeklyResetLabel(limit.resetsAt, t.common.dateLocale);
  const text =
    limit.usedMicroUsd !== null && limit.limitMicroUsd !== null
      ? copy.nearAmounts(
          organizationName,
          formatUsd(locale, limit.usedMicroUsd),
          formatUsd(locale, limit.limitMicroUsd),
          limit.percent,
          reset
        )
      : copy.near(organizationName, limit.percent, reset);
  return (
    <div
      data-testid="assistant-near-limit"
      className="flex items-center gap-2.5 px-2 text-[12.5px]"
      style={{ color: "var(--text-muted)" }}
    >
      <span
        className="relative h-1 w-14 shrink-0 overflow-hidden rounded-full"
        style={{ background: "var(--border-soft)" }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={limit.percent}
        aria-label={text}
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${limit.percent}%`, background: "var(--warm)" }}
        />
      </span>
      <span>{text}</span>
    </div>
  );
}

/** Replaces the composer while the organization's Weekly limit is reached. */
export function LimitReached({
  organizationName,
  limit,
  canSeeUsage,
  organizationId,
}: {
  organizationName: string;
  limit: WeeklyLimitState;
  canSeeUsage: boolean;
  organizationId: string | null;
}) {
  const { t } = useTranslation();
  const copy = t.assistant.limit;
  return (
    <div
      role="status"
      className="rounded-[var(--radius-lg)] px-4 py-3"
      style={{ background: "var(--warm-soft)" }}
    >
      <div className="text-[14px] leading-[1.5]">
        <span className="font-semibold">
          {copy.paused(weeklyResetLabel(limit.resetsAt, t.common.dateLocale))}
        </span>{" "}
        {copy.pausedBody(organizationName)}
      </div>
      {canSeeUsage ? (
        <Link
          href={aiUsageHref(organizationId)}
          className="mt-1 inline-block text-[13.5px] font-semibold underline-offset-2 hover:underline"
        >
          {copy.seeUsage}
        </Link>
      ) : null}
    </div>
  );
}

/** Replaces the composer while Anthropic refuses for its spend limit or credits. */
export function AssistantUnavailable() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className="rounded-[var(--radius-lg)] px-4 py-3 text-[14px] leading-[1.5]"
      style={{ background: "var(--surface-2)" }}
    >
      {t.assistant.unavailable}
    </div>
  );
}

export function UpgradeGate({ organization }: { organization: AssistantOrganization }) {
  const { t } = useTranslation();
  const copy = t.assistant.upgrade;
  return (
    <div>
      <h2 className="font-heading text-[22px] leading-tight font-bold">{copy.title}</h2>
      <p className="mt-2 text-[14.5px] leading-[1.55]">
        {copy.body(organization.organizationName)}
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-4 text-[14px] leading-[1.55]">
        {copy.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <div className="mt-4">
        <Button asChild size="sm">
          <Link href="/billing/">{copy.cta}</Link>
        </Button>
      </div>
      <p className="mt-3 text-[12.5px]" style={{ color: "var(--text-faint)" }}>
        {copy.onlyYou}
      </p>
    </div>
  );
}

export function OffGate({ organization }: { organization: AssistantOrganization }) {
  const { t } = useTranslation();
  const copy = t.assistant.off;
  return (
    <div>
      <h2 className="font-heading text-[22px] leading-tight font-bold">
        {copy.title(organization.organizationName)}
      </h2>
      <p className="mt-2 text-[14.5px] leading-[1.55]">{copy.body}</p>
      <div className="mt-4">
        <Button asChild size="sm">
          <Link href="/organization/">{copy.cta}</Link>
        </Button>
      </div>
      <p className="mt-3 text-[12.5px]" style={{ color: "var(--text-faint)" }}>
        {copy.onlyAdmins}
      </p>
    </div>
  );
}
