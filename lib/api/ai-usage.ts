import { api } from "./client";
import type { AiConnectionAccess, AiConnectionApp } from "./ai-connections";

/** One of a person's AI connections, as the AI usage page lists it. */
export type AiUsageApp = {
  grantId: string;
  app: AiConnectionApp;
  access: AiConnectionAccess;
  connectedAt: string;
  lastUsedAt: string;
};

export type AiUsagePerson = {
  /** `null` for Usage whose account link was erased. */
  userId: string | null;
  /** `null` shows as Deleted account. */
  name: string | null;
  assistantMicroUsd: number;
  refusedTurns: number;
};

export type AiUsagePersonToday = AiUsagePerson & {
  callsToday: number;
  apps: AiUsageApp[];
};

export type AiUsageWeek = {
  /** The week's Monday, `YYYY-MM-DD`. */
  weekStart: string;
  usedMicroUsd: number;
  limitReachedAt: string | null;
  /** Within 180 days: the week opens to a per-person split. */
  perPerson: boolean;
};

export type AiUsageDay = { day: string; calls: number; limitReachedAt: string | null };

export type AiUsage = {
  organizationId: string;
  organizationName: string;
  assistant: {
    on: boolean;
    weekStart: string;
    /** Settled plus reserved, so answers being written count. */
    usedMicroUsd: number;
    limitMicroUsd: number;
    resetsAt: string;
    reached: boolean;
    limitReachedAt: string | null;
    /** Past weeks with Usage, newest first. */
    weeks: AiUsageWeek[];
  };
  aiConnections: {
    on: boolean;
    dailyLimit: number;
    memberDailyLimit: number;
    callsToday: number;
    resetsAt: string;
    /** 14 UTC days, oldest first, today last. */
    days: AiUsageDay[];
  };
  people: AiUsagePersonToday[];
};

export type AiUsageWeekDetail = {
  weekStart: string;
  usedMicroUsd: number;
  /** `null` once the week is past the 180 days per-person usage is kept. */
  people: AiUsagePerson[] | null;
};

/** Refused turns from this many on are marked. */
export const REFUSED_WARNING = 3;

const scoped = (path: string, organizationId: string) =>
  `${path}?organizationId=${encodeURIComponent(organizationId)}`;

export function getAiUsage(organizationId: string): Promise<AiUsage> {
  return api<AiUsage>(scoped("/api/organization/ai/usage", organizationId));
}

export function getAiUsageWeek(
  organizationId: string,
  weekStart: string
): Promise<AiUsageWeekDetail> {
  return api<AiUsageWeekDetail>(
    scoped(`/api/organization/ai/usage/weeks/${encodeURIComponent(weekStart)}`, organizationId)
  );
}

export function revokeAiConnection(organizationId: string, grantId: string): Promise<void> {
  return api<void>(
    scoped(`/api/organization/ai/connections/${encodeURIComponent(grantId)}`, organizationId),
    { method: "DELETE" }
  );
}

/** The AI usage page, opened on one organization when the link knows which. */
export function aiUsageHref(organizationId?: string | null): string {
  return organizationId
    ? `/ai-usage/?organizationId=${encodeURIComponent(organizationId)}`
    : "/ai-usage/";
}

/** Mondays from `weeks` weeks before `weekStart` up to it, oldest first. */
export function weekStartsBefore(weekStart: string, weeks: number): string[] {
  const monday = Date.parse(`${weekStart}T00:00:00Z`);
  return Array.from({ length: weeks + 1 }, (_, index) =>
    new Date(monday - (weeks - index) * 7 * 86_400_000).toISOString().slice(0, 10)
  );
}
