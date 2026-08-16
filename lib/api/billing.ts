import { api } from "./client";
import type { Iso, UUID } from "./types";

export type PlanName = "FREE" | "PRO" | "ENTERPRISE" | "CUSTOM";
export type PaidPlan = "PRO" | "ENTERPRISE";
export type BillingCycle = "MONTHLY" | "YEARLY";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "paused" | "canceled";

export type Entitlements = {
  plan: PlanName;
  maxGroups: number;
  maxMembersPerGroup: number;
  /** False once grace has expired — over-limit groups are read-only. */
  writable: boolean;
  graceEndsAt: Iso | null;
};

export type SubscriptionSummary = {
  plan: PaidPlan | null;
  status: SubscriptionStatus | null;
  billingCycle: BillingCycle | null;
  extraGroupSlots: number;
  currentPeriodEnd: Iso | null;
  graceEndsAt: Iso | null;
  cancelAt: Iso | null;
};

export type GroupUsage = {
  id: UUID;
  groupName: string;
  members: number;
};

export type PlanLimits = Record<
  "FREE" | "PRO" | "ENTERPRISE",
  { groups: number; membersPerGroup: number; maxExtraSlots: number }
>;

export type BillingOverview = {
  organization: {
    id: UUID;
    name: string;
    billingEmail: string;
    hasPaddleCustomer: boolean;
  } | null;
  subscription: SubscriptionSummary | null;
  entitlements: Entitlements;
  usage: { groupsUsed: number; groups: GroupUsage[] };
  planLimits: PlanLimits;
};

export type CheckoutInput = {
  plan: PaidPlan;
  billingCycle: BillingCycle;
  extraGroupSlots?: number;
};

export function getBillingOverview(): Promise<BillingOverview> {
  return api<BillingOverview>(`/api/billing/subscription`);
}

/** The backend creates the transaction; the client only opens the overlay. */
export function createCheckout(input: CheckoutInput): Promise<{ transactionId: string }> {
  return api<{ transactionId: string }>(`/api/billing/checkout`, { method: "POST", body: input });
}

export function createPortalSession(): Promise<{ url: string }> {
  return api<{ url: string }>(`/api/billing/portal`, { method: "POST" });
}

export function updateExtraSlots(
  extraGroupSlots: number
): Promise<{ extraGroupSlots: number; changed: boolean }> {
  return api(`/api/billing/slots`, { method: "PATCH", body: { extraGroupSlots } });
}

export function changePlan(input: {
  plan: PaidPlan;
  billingCycle: BillingCycle;
}): Promise<{ plan: PaidPlan; billingCycle: BillingCycle; changed: boolean }> {
  return api(`/api/billing/change-plan`, { method: "POST", body: input });
}
