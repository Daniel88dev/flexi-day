import type { PaidPlan } from "@/lib/api/billing";

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

export const formatEur = (locale: string, value: number): string =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
