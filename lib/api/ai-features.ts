import { api } from "./client";

export type AiFeature = "assistant" | "aiConnections";

export type OrganizationAiAvailability = {
  organizationId: string;
  assistant: boolean;
  aiConnections: boolean;
  /** The caller owns it and has a raised AI features agreement version to accept. */
  newAgreementVersionReady: boolean;
};

/** Whether the backend's kill switches and preview list leave each AI feature open to the caller. */
export type AiAvailability = {
  /** Open in at least one of the caller's organizations, or switched on for everyone. */
  assistant: boolean;
  aiConnections: boolean;
  organizations: OrganizationAiAvailability[];
};

export function getAiAvailability(): Promise<AiAvailability> {
  return api<AiAvailability>("/api/ai-features/availability");
}

/** Unknown counts as unavailable, so an entry point never shows before the answer does. */
export function isAiFeatureAvailable(
  availability: AiAvailability | undefined,
  feature: AiFeature,
  organizationId?: string
): boolean {
  if (!availability) return false;
  if (organizationId === undefined) return availability[feature];
  return (
    availability.organizations.find((o) => o.organizationId === organizationId)?.[feature] ?? false
  );
}
