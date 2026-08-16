import type { PaidPlan } from "@/lib/api/billing";

export type BillingCycleKey = "monthly" | "yearly";

/** Length of a free trial, and the unit it is expressed in. */
export type TrialLength = { count: number; unit: "day" | "month" };

/**
 * Display prices in EUR, excluding VAT. Charging always uses the Paddle price
 * ids held server-side (`PADDLE_PRICE_*`); these figures exist only to render
 * the billing page and the marketing pricing section from one source, so the
 * two surfaces cannot drift apart. Changing a price in Paddle means changing
 * it here too.
 */
export const PLAN_PRICES: Record<PaidPlan, { monthly: number; yearly: number }> = {
  PRO: { monthly: 8, yearly: 80 },
  ENTERPRISE: { monthly: 16, yearly: 160 },
};

/** Extra group slot, EUR excluding VAT. */
export const SLOT_PRICE = { monthly: 1.5, yearly: 15 } as const;

/**
 * Free trial per billing cycle, same on Pro and Enterprise. Paddle owns the
 * actual trial — it is configured on the price and enforced there; these values
 * exist only so the pricing surfaces can say so. Changing the trial in Paddle
 * means changing it here too. Extra group slots are billed immediately and are
 * deliberately not covered.
 */
export const TRIAL: Record<BillingCycleKey, TrialLength> = {
  monthly: { count: 10, unit: "day" },
  yearly: { count: 2, unit: "month" },
};

export const formatEur = (locale: string, value: number): string =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
