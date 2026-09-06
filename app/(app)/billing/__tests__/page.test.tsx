import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BillingPage from "../page";
import { renderWithClient } from "@/lib/test-utils";
import type { BillingOverview } from "@/lib/api/billing";
import { I18nContext } from "@/lib/i18n/i18n-provider";
import { dictionaries } from "@/lib/i18n";

const checkoutMutate = vi.fn();
const changePlanMutate = vi.fn();
const portalMutate = vi.fn();
const slotsMutate = vi.fn();

let overview: BillingOverview;

const PORTAL_URL = "https://customer-portal.paddle.com/cpl_abc123";

const baseOverview = (): BillingOverview => ({
  organization: null,
  subscription: null,
  entitlements: {
    plan: "FREE",
    maxGroups: 3,
    maxMembersPerGroup: 10,
    writable: true,
    graceEndsAt: null,
  },
  usage: { groupsUsed: 1, groups: [{ id: "g-1", groupName: "Platform", members: 4 }] },
  planLimits: {
    FREE: { groups: 3, membersPerGroup: 10, maxExtraSlots: 0 },
    PRO: { groups: 5, membersPerGroup: 25, maxExtraSlots: 4 },
    ENTERPRISE: { groups: 20, membersPerGroup: 100, maxExtraSlots: 20 },
  },
});

vi.mock("@/lib/api/queries", () => ({
  qk: { subscription: () => ["subscription"] as const },
  useSubscription: () => ({ data: overview, isLoading: false, error: null }),
  useCreateCheckout: () => ({ mutateAsync: checkoutMutate, isPending: false }),
  useChangePlan: () => ({ mutateAsync: changePlanMutate, isPending: false }),
  useCreatePortalSession: () => ({ mutateAsync: portalMutate, isPending: false }),
  useUpdateExtraSlots: () => ({ mutateAsync: slotsMutate, isPending: false }),
}));

const openCheckoutMock = vi.fn();
let paddleConfigured = true;
vi.mock("@/lib/paddle", () => ({
  openCheckout: (...args: unknown[]) => openCheckoutMock(...args),
  isPaddleConfigured: () => paddleConfigured,
}));

const pushToastMock = vi.fn();
vi.mock("@/components/toast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/toast")>()),
  pushToast: (...args: unknown[]) => pushToastMock(...args),
}));

describe("BillingPage", () => {
  beforeEach(() => {
    overview = baseOverview();
    paddleConfigured = true;
    checkoutMutate.mockReset().mockResolvedValue({ transactionId: "txn-1" });
    openCheckoutMock.mockReset().mockResolvedValue(true);
    changePlanMutate.mockReset();
    portalMutate.mockReset().mockResolvedValue({ url: PORTAL_URL });
    pushToastMock.mockReset();
  });

  it("disables Subscribe when no Paddle client token is configured", () => {
    // Otherwise every click mints an orphaned Paddle transaction before the
    // overlay discovers it cannot open.
    paddleConfigured = false;
    renderWithClient(<BillingPage />);

    for (const button of screen.getAllByRole("button", { name: "Subscribe" })) {
      expect(button).toBeDisabled();
    }
  });

  it("shows the current plan and usage meters", () => {
    renderWithClient(<BillingPage />);

    expect(screen.getByRole("heading", { name: "Billing" })).toBeInTheDocument();
    expect(screen.getByText("1 of 3 groups used")).toBeInTheDocument();
    expect(screen.getByText("Platform")).toBeInTheDocument();
    // Appears as the card title and as the Free tier's disabled button.
    expect(screen.getAllByText("Current plan").length).toBeGreaterThan(0);
  });

  it("lists attachments on the paid plan cards only", () => {
    renderWithClient(<BillingPage />);

    expect(screen.getAllByText("Attachments on requests (images & PDF)")).toHaveLength(2);
  });

  it("lists attachments on the paid plan cards in Czech", () => {
    renderWithClient(
      <I18nContext.Provider
        value={{ locale: "cs", setLocale: () => {}, t: dictionaries.cs, localeReady: true }}
      >
        <BillingPage />
      </I18nContext.Provider>
    );

    expect(screen.getAllByText("Přílohy k žádostem (obrázky a PDF)")).toHaveLength(2);
  });

  it("defaults the cycle toggle to yearly and shows ex-VAT yearly prices", () => {
    renderWithClient(<BillingPage />);

    expect(screen.getByText("€80")).toBeInTheDocument();
    expect(screen.getByText("€160")).toBeInTheDocument();
  });

  it("switches to monthly prices on toggle", async () => {
    const user = userEvent.setup();
    renderWithClient(<BillingPage />);

    await user.click(screen.getByRole("button", { name: "Monthly" }));
    expect(screen.getByText("€8")).toBeInTheDocument();
    expect(screen.getByText("€16")).toBeInTheDocument();
  });

  it("starts a checkout through the backend transaction and the overlay", async () => {
    const user = userEvent.setup();
    renderWithClient(<BillingPage />);

    const subscribeButtons = screen.getAllByRole("button", { name: "Subscribe" });
    await user.click(subscribeButtons[0]!);

    expect(checkoutMutate).toHaveBeenCalledWith({ plan: "PRO", billingCycle: "YEARLY" });
    expect(openCheckoutMock).toHaveBeenCalledWith("txn-1", expect.any(Function));
  });

  it("routes a past_due subscriber to the portal instead of a checkout that 409s", async () => {
    overview.subscription = {
      plan: "PRO",
      status: "past_due",
      billingCycle: "YEARLY",
      extraGroupSlots: 0,
      currentPeriodEnd: null,
      graceEndsAt: "2026-08-25T12:00:00.000Z",
      cancelAt: null,
    };
    overview.entitlements = {
      plan: "PRO",
      maxGroups: 5,
      maxMembersPerGroup: 25,
      writable: true,
      graceEndsAt: "2026-08-25T12:00:00.000Z",
    };
    overview.organization = {
      id: "org-1",
      name: "Acme",
      billingEmail: "a@b.co",
      hasPaddleCustomer: true,
    };

    renderWithClient(<BillingPage />);

    // The backend refuses both checkout and change-plan in past_due, so no
    // card may offer Subscribe.
    expect(screen.queryByRole("button", { name: "Subscribe" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Manage payment method/ }).length).toBeGreaterThan(
      0
    );
  });

  it("offers plan switching only while the subscription is active", () => {
    overview.subscription = {
      plan: "PRO",
      status: "active",
      billingCycle: "YEARLY",
      extraGroupSlots: 0,
      currentPeriodEnd: null,
      graceEndsAt: null,
      cancelAt: null,
    };
    overview.entitlements = {
      plan: "PRO",
      maxGroups: 5,
      maxMembersPerGroup: 25,
      writable: true,
      graceEndsAt: null,
    };

    renderWithClient(<BillingPage />);

    expect(screen.getByRole("button", { name: "Switch to this plan" })).toBeInTheDocument();
  });

  it("shows the grace warning while grace is running", () => {
    overview.entitlements.graceEndsAt = "2026-08-25T12:00:00.000Z";
    renderWithClient(<BillingPage />);

    expect(screen.getByText(/problem with your subscription/i)).toBeInTheDocument();
  });

  it("shows the read-only notice once grace has expired", () => {
    overview.entitlements.writable = false;
    renderWithClient(<BillingPage />);

    expect(screen.getByText(/read-only until you upgrade/i)).toBeInTheDocument();
  });

  it("advertises the trial on the paid plans to someone with no subscription", () => {
    // Yearly is preselected, so the yearly trial is the one on screen.
    renderWithClient(<BillingPage />);

    expect(screen.getAllByText("2 months free")).toHaveLength(2);
    // The price stays the headline — the trial is additional, not a substitute.
    expect(screen.getByText("€80")).toBeInTheDocument();
  });

  it("switches to the monthly trial when the monthly cycle is selected", async () => {
    renderWithClient(<BillingPage />);

    await userEvent.click(screen.getByRole("button", { name: "Monthly" }));

    expect(screen.getAllByText("10 days free")).toHaveLength(2);
  });

  it("hides the trial once the org already has a subscription", () => {
    // Paddle grants a trial on first subscribe only — showing it on a switch
    // would promise something Paddle will not honour.
    overview.subscription = {
      plan: "PRO",
      status: "active",
      billingCycle: "YEARLY",
      extraGroupSlots: 0,
      currentPeriodEnd: null,
      graceEndsAt: null,
      cancelAt: null,
    };

    renderWithClient(<BillingPage />);

    expect(screen.queryByText("2 months free")).not.toBeInTheDocument();
    expect(screen.queryByText("10 days free")).not.toBeInTheDocument();
  });

  it("reports the trial end rather than a renewal while trialing", () => {
    overview.subscription = {
      plan: "PRO",
      status: "trialing",
      billingCycle: "YEARLY",
      extraGroupSlots: 0,
      currentPeriodEnd: "2026-10-16T12:00:00.000Z",
      graceEndsAt: null,
      cancelAt: null,
    };

    renderWithClient(<BillingPage />);

    expect(screen.getByText(/Free trial ends on 16 October 2026/)).toBeInTheDocument();
    expect(screen.queryByText(/Renews on/)).not.toBeInTheDocument();
    expect(screen.getByText(/not part of the free trial/i)).toBeInTheDocument();
  });
  describe("the billing portal", () => {
    const HERE = "http://localhost:3000/billing";

    /**
     * Stands in for the tab `handlePortal` opens before it has a URL to send
     * there. Returns null for `noopener` for the reason `handlePortal`
     * documents, and for `blocked` the way a popup blocker does.
     */
    function stubTab({ blocked = false } = {}) {
      const tab = { location: { href: "" }, close: vi.fn(), opener: window as unknown };
      const open = vi
        .spyOn(window, "open")
        .mockImplementation((_url, _target, features) =>
          blocked || (typeof features === "string" && features.includes("noopener"))
            ? null
            : (tab as unknown as Window)
        );
      return { tab, open };
    }

    let here: { href: string };
    let restoreLocation: () => void;

    beforeEach(() => {
      overview.organization = {
        id: "org-1",
        name: "Acme",
        billingEmail: "a@b.co",
        hasPaddleCustomer: true,
      };
      // A plain stand-in, so an accidental same-tab navigation is observable
      // rather than swallowed by jsdom's unimplemented navigation.
      const original = Object.getOwnPropertyDescriptor(window, "location")!;
      here = { href: HERE };
      Object.defineProperty(window, "location", { configurable: true, value: here });
      restoreLocation = () => Object.defineProperty(window, "location", original);
    });

    afterEach(() => {
      restoreLocation();
      vi.restoreAllMocks();
    });

    async function clickManage() {
      const user = userEvent.setup();
      renderWithClient(<BillingPage />);
      await user.click(screen.getByRole("button", { name: /Manage payment method/ }));
    }

    it("sends the portal URL to the tab it opened, leaving this one where it is", async () => {
      const { tab, open } = stubTab();

      await clickManage();

      expect(open).toHaveBeenCalledWith("", "_blank");
      expect(tab.location.href).toBe(PORTAL_URL);
      expect(tab.opener).toBeNull();
      expect(here.href).toBe(HERE);
    });

    it("opens the tab synchronously, so Safari keeps the user gesture", async () => {
      const { tab, open } = stubTab();
      let resolvePortal: (value: { url: string }) => void = () => {};
      portalMutate.mockReturnValue(
        new Promise<{ url: string }>((resolve) => {
          resolvePortal = resolve;
        })
      );
      renderWithClient(<BillingPage />);

      // fireEvent rather than userEvent: it returns before the microtask queue
      // runs, so an await slipped in ahead of window.open leaves this red.
      fireEvent.click(screen.getByRole("button", { name: /Manage payment method/ }));
      expect(open).toHaveBeenCalledTimes(1);

      resolvePortal({ url: PORTAL_URL });
      await waitFor(() => expect(tab.location.href).toBe(PORTAL_URL));
    });

    it("falls back to this tab only when the browser blocks the popup", async () => {
      stubTab({ blocked: true });

      await clickManage();

      expect(here.href).toBe(PORTAL_URL);
    });

    it("closes the tab it opened and warns when the portal request fails", async () => {
      const { tab } = stubTab();
      portalMutate.mockRejectedValue(new Error("No billing account yet — subscribe first"));

      await clickManage();

      expect(tab.close).toHaveBeenCalled();
      expect(tab.location.href).toBe("");
      expect(here.href).toBe(HERE);
      expect(pushToastMock).toHaveBeenCalledWith(
        "No billing account yet — subscribe first",
        "danger"
      );
    });

    it("warns in our own words when the failure carries no message", async () => {
      const { tab } = stubTab();
      portalMutate.mockRejectedValue("not an Error");

      await clickManage();

      expect(tab.close).toHaveBeenCalled();
      expect(pushToastMock).toHaveBeenCalledWith("Could not open the billing portal", "danger");
    });
  });
});
