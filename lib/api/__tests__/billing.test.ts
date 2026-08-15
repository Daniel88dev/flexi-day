import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import {
  changePlan,
  createCheckout,
  createPortalSession,
  getBillingOverview,
  updateExtraSlots,
} from "../billing";

describe("billing api", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({ ok: true });
  });

  it("getBillingOverview GETs the subscription", async () => {
    await getBillingOverview();
    expect(apiMock).toHaveBeenCalledWith("/api/billing/subscription");
  });

  it("createCheckout POSTs the plan choice", async () => {
    const input = { plan: "PRO", billingCycle: "YEARLY" } as const;
    await createCheckout(input);
    expect(apiMock).toHaveBeenCalledWith("/api/billing/checkout", { method: "POST", body: input });
  });

  it("createPortalSession POSTs to the portal endpoint", async () => {
    await createPortalSession();
    expect(apiMock).toHaveBeenCalledWith("/api/billing/portal", { method: "POST" });
  });

  it("updateExtraSlots PATCHes the quantity", async () => {
    await updateExtraSlots(3);
    expect(apiMock).toHaveBeenCalledWith("/api/billing/slots", {
      method: "PATCH",
      body: { extraGroupSlots: 3 },
    });
  });

  it("changePlan POSTs the new plan and cycle", async () => {
    const input = { plan: "ENTERPRISE", billingCycle: "MONTHLY" } as const;
    await changePlan(input);
    expect(apiMock).toHaveBeenCalledWith("/api/billing/change-plan", {
      method: "POST",
      body: input,
    });
  });
});
