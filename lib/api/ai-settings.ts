import { api } from "./client";

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

/** `GET /api/organization/ai`: what the AI card shows an owner or org admin. */
export type AiSettings = {
  organizationId: string;
  isOwner: boolean;
  ownerName: string;
  plan: AiPlan;
  assistant: { enabled: boolean; enabledAt: string | null; planAllows: boolean };
  agreement: AiAgreementState;
  /** The text "Tell members" sends, in both languages, so the AI card copies the same words. */
  memberNotice: { assistant: { en: NoticeText; cs: NoticeText } };
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
