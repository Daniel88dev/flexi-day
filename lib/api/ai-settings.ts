import { api } from "./client";
import type { OrganizationAiConnection } from "./ai-connections";

export type NoticeText = { title: string; body: string };

export type AiPlan = "FREE" | "PRO" | "ENTERPRISE" | "CUSTOM";

export type AiAgreementState = {
  currentVersion: number;
  acceptedVersion: number | null;
  acceptedAt: string | null;
  acceptedByName: string | null;
  /** An AI feature is on and the newest acceptance is older than the current version. */
  newVersionReady: boolean;
};

/** The owner's AI connections setting. */
export type AiConnectionsLevel = "off" | "read" | "write";

/** `GET /api/organization/ai`: what the AI card shows an owner or org admin. */
export type AiSettings = {
  organizationId: string;
  isOwner: boolean;
  ownerName: string;
  plan: AiPlan;
  assistant: {
    enabled: boolean;
    enabledAt: string | null;
    planAllows: boolean;
    /** The organization's Weekly limit on Assistant Usage, in micro-USD. */
    weeklyLimitMicroUsd: number;
  };
  /**
   * `planAllows`: any Paid plan, so the owner may raise it. `grants`: every AI
   * connection in the organization, which the lower and off dialogs name.
   */
  aiConnections: {
    level: AiConnectionsLevel;
    planAllows: boolean;
    grants: OrganizationAiConnection[];
  };
  agreement: AiAgreementState;
  /** The texts "Tell members" sends, in both languages, so the AI card copies the same words. */
  memberNotice: {
    assistant: { en: NoticeText; cs: NoticeText };
    aiConnections: { en: NoticeText; cs: NoticeText };
  };
};

export type EnableAssistantInput = { agreementVersion: number; tellMembers: boolean };

const scoped = (path: string, organizationId: string) =>
  `${path}?organizationId=${encodeURIComponent(organizationId)}`;

export function getAiSettings(organizationId: string): Promise<AiSettings> {
  return api<AiSettings>(scoped("/api/organization/ai", organizationId));
}

/** Owner only; sends the agreement version the owner was shown. */
export function enableAssistant(
  organizationId: string,
  input: EnableAssistantInput
): Promise<AiSettings> {
  return api<AiSettings>(scoped("/api/organization/ai/assistant/enable", organizationId), {
    method: "POST",
    body: input,
  });
}

export function disableAssistant(organizationId: string): Promise<AiSettings> {
  return api<AiSettings>(scoped("/api/organization/ai/assistant/disable", organizationId), {
    method: "POST",
  });
}

export function acceptAiAgreement(
  organizationId: string,
  agreementVersion: number
): Promise<AiSettings> {
  return api<AiSettings>(scoped("/api/organization/ai/agreement", organizationId), {
    method: "POST",
    body: { agreementVersion },
  });
}

export type EnableAiConnectionsInput = EnableAssistantInput & { level: "read" | "write" };

/** Owner only; the first turn-on sends the agreement version the owner was shown. */
export function enableAiConnections(
  organizationId: string,
  input: EnableAiConnectionsInput
): Promise<AiSettings> {
  return api<AiSettings>(scoped("/api/organization/ai/connections/enable", organizationId), {
    method: "POST",
    body: input,
  });
}

/** Moves between Read only and Read and write while AI connections are on. */
export function setAiConnectionsLevel(
  organizationId: string,
  level: "read" | "write"
): Promise<AiSettings> {
  return api<AiSettings>(scoped("/api/organization/ai/connections/level", organizationId), {
    method: "POST",
    body: { level },
  });
}

export function disableAiConnections(organizationId: string): Promise<AiSettings> {
  return api<AiSettings>(scoped("/api/organization/ai/connections/disable", organizationId), {
    method: "POST",
  });
}

/** The daily AI connection limit per organization (Pro 5,000, Enterprise and Custom 20,000). */
export function dailyAiConnectionLimit(plan: AiPlan): number {
  return plan === "PRO" ? 5_000 : 20_000;
}

/** The member daily limit: AI connection calls per member per UTC day. */
export const MEMBER_DAILY_LIMIT = 1_000;

/** The notice as one paragraph, the way an owner pastes it into their own policy. */
export function memberNoticeText(notice: NoticeText): string {
  return `${notice.title} ${notice.body}`;
}

/** When the Weekly limit resets: Monday 00:00 UTC, the next one after `now`. */
export function nextWeeklyReset(now: Date): Date {
  const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const daysToMonday = (8 - reset.getUTCDay()) % 7 || 7;
  reset.setUTCDate(reset.getUTCDate() + daysToMonday);
  return reset;
}

/** Dollars as the app writes them: "$10" and "$4.30" in English, "10 $" and "4,30 $" in Czech. */
export function formatUsd(locale: "en" | "cs", microUsd: number): string {
  const cents = Math.round(microUsd / 10_000);
  const amount = (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
  return locale === "cs" ? `${amount.replace(".", ",")} $` : `$${amount}`;
}
