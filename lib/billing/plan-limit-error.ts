import { ApiError } from "@/lib/api/client";

export type PlanLimitReason = "PLAN_LIMIT" | "READ_ONLY";

export type PlanLimitInfo = {
  reason: PlanLimitReason;
  limit: number;
  current: number;
};

/**
 * Reads the backend's 402 payload. The guards attach
 * `publicContext: { reason, limit, current }`, which `errorMiddleware`
 * serialises as `errors[0].context` — without this the UI would fall back to
 * the raw English message and lose the upgrade prompt entirely.
 */
export function planLimitFromError(error: unknown): PlanLimitInfo | null {
  if (!(error instanceof ApiError) || error.status !== 402) return null;

  const context = error.context<Partial<PlanLimitInfo>>();
  if (!context) return null;
  if (context.reason !== "PLAN_LIMIT" && context.reason !== "READ_ONLY") return null;

  return {
    reason: context.reason,
    limit: typeof context.limit === "number" ? context.limit : 0,
    current: typeof context.current === "number" ? context.current : 0,
  };
}
