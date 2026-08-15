"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, CreditCard, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useChangePlan,
  useCreateCheckout,
  useCreatePortalSession,
  useSubscription,
  useUpdateExtraSlots,
  qk,
} from "@/lib/api/queries";
import type { BillingCycle, BillingOverview, PaidPlan } from "@/lib/api/billing";
import { isPaddleConfigured, openCheckout } from "@/lib/paddle";
import { PLAN_PRICES, formatEur } from "@/lib/billing/prices";
import { pushToast } from "@/components/toast";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useQueryClient } from "@tanstack/react-query";

/** Statuses the backend's checkout route rejects as "already subscribed". */
const SUBSCRIBED_STATUSES = new Set(["active", "trialing", "past_due", "paused"]);
/** Statuses on which Paddle will accept a plan or slot change. */
const MODIFIABLE_STATUSES = new Set(["active"]);

function UsageMeter({ label, used, max }: { label: string; used: number; max: number }) {
  const ratio = max > 0 ? Math.min(1, used / max) : 0;
  const critical = max > 0 && used >= max;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-sm">{label}</span>
        <span
          className={`text-xs tabular-nums ${critical ? "text-destructive font-semibold" : "text-muted-foreground"}`}
        >
          {used} / {max}
        </span>
      </div>
      <div className="bg-muted h-1.5 overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full ${critical ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${(ratio * 100).toFixed(1)}%` }}
        />
      </div>
    </div>
  );
}

function PlanCard({
  overview,
  plan,
  cycle,
  onSubscribed,
  onManageBilling,
}: {
  overview: BillingOverview;
  plan: "FREE" | PaidPlan;
  cycle: BillingCycle;
  onSubscribed: () => void;
  onManageBilling: () => void;
}) {
  const { t } = useTranslation();
  const createCheckout = useCreateCheckout();
  const changePlan = useChangePlan();

  const limits = overview.planLimits[plan];
  const status = overview.subscription?.status ?? null;
  const isCurrent =
    plan === overview.entitlements.plan &&
    (plan === "FREE" || overview.subscription?.billingCycle === cycle);
  const hasSubscription = status !== null && SUBSCRIBED_STATUSES.has(status);
  const canSwitch = status !== null && MODIFIABLE_STATUSES.has(status);

  async function handleSelect() {
    if (plan === "FREE") return;
    try {
      if (canSwitch) {
        await changePlan.mutateAsync({ plan, billingCycle: cycle });
        pushToast(t.billing.planChanged);
        return;
      }
      const { transactionId } = await createCheckout.mutateAsync({ plan, billingCycle: cycle });
      const opened = await openCheckout(transactionId, onSubscribed);
      if (!opened) pushToast(t.billing.notConfigured, "danger");
    } catch (err) {
      pushToast(
        err instanceof Error
          ? err.message
          : canSwitch
            ? t.billing.changeFailed
            : t.billing.checkoutFailed,
        "danger"
      );
    }
  }

  const price =
    plan === "FREE"
      ? t.billing.freePrice
      : formatEur(
          t.common.dateLocale,
          PLAN_PRICES[plan][cycle === "YEARLY" ? "yearly" : "monthly"]
        );
  const per = cycle === "YEARLY" ? t.billing.perYear : t.billing.perMonth;
  const busy = createCheckout.isPending || changePlan.isPending;

  const action = (() => {
    if (isCurrent) {
      return (
        <Button className="w-full" variant="outline" disabled>
          {t.billing.current}
        </Button>
      );
    }
    if (plan === "FREE") return null;
    if (canSwitch) {
      return (
        <Button className="w-full" onClick={handleSelect} disabled={busy}>
          {t.billing.switchPlan}
        </Button>
      );
    }
    // past_due / paused: the backend refuses both checkout and change-plan, so
    // sending them to the portal is the only route that actually works.
    if (hasSubscription) {
      return (
        <Button className="w-full" variant="outline" onClick={onManageBilling}>
          {t.billing.managePayment}
        </Button>
      );
    }
    if (!isPaddleConfigured()) {
      return (
        <Button className="w-full" disabled>
          {t.billing.subscribe}
        </Button>
      );
    }
    return (
      <Button className="w-full" onClick={handleSelect} disabled={busy}>
        {t.billing.subscribe}
      </Button>
    );
  })();

  return (
    <Card className={plan === "PRO" ? "border-primary/60" : undefined}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t.billing.planNames[plan]}</CardTitle>
        <div className="flex items-baseline gap-1.5">
          <span className="font-heading text-3xl font-bold">{price}</span>
          {plan !== "FREE" ? (
            <span className="text-muted-foreground text-xs">
              {per} · {t.billing.excludingVat}
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <Check className="text-primary h-4 w-4 shrink-0" />
            {t.billing.featureGroups(limits.groups)}
          </li>
          <li className="flex items-center gap-2">
            <Check className="text-primary h-4 w-4 shrink-0" />
            {t.billing.featureMembers(limits.membersPerGroup)}
          </li>
          {limits.maxExtraSlots > 0 ? (
            <li className="flex items-center gap-2">
              <Check className="text-primary h-4 w-4 shrink-0" />
              {t.billing.featureSlots(limits.maxExtraSlots)}
            </li>
          ) : null}
        </ul>
        {action}
      </CardContent>
    </Card>
  );
}

export function BillingScreen() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const overviewQuery = useSubscription();
  const portal = useCreatePortalSession();
  const updateSlots = useUpdateExtraSlots();

  // Yearly deliberately preselected: Paddle's fixed per-transaction fee makes
  // annual billing roughly twice as efficient as monthly.
  const [cycle, setCycle] = useState<BillingCycle>("YEARLY");
  const [slotDraft, setSlotDraft] = useState<number | null>(null);
  /** When the overlay last completed; null once we stop waiting. */
  const [awaitingSince, setAwaitingSince] = useState<number | null>(null);

  const overview = overviewQuery.data;
  const subscriptionStatus = overview?.subscription?.status ?? null;

  // Derived, not stored: the moment the webhook lands (or the window lapses)
  // this flips false without a setState inside the effect.
  const awaitingWebhook =
    awaitingSince !== null && subscriptionStatus === null && Date.now() - awaitingSince < 90_000;

  // The webhook is the source of truth, so after the overlay closes we poll for
  // it rather than trusting the client-side callback. Cleared on unmount, so a
  // closed page stops polling.
  useEffect(() => {
    if (!awaitingWebhook) return;

    const timer = setInterval(() => {
      void qc.invalidateQueries({ queryKey: qk.subscription() });
    }, 3000);

    return () => clearInterval(timer);
  }, [awaitingWebhook, qc]);

  function refetchSubscription() {
    setAwaitingSince(Date.now());
    void qc.invalidateQueries({ queryKey: qk.subscription() });
  }

  async function handlePortal() {
    // Opened synchronously: awaiting first breaks the user-gesture chain and
    // Safari blocks the popup outright.
    const tab = window.open("", "_blank", "noopener");
    try {
      const { url } = await portal.mutateAsync();
      if (tab) tab.location.href = url;
      else window.location.href = url;
    } catch (err) {
      tab?.close();
      pushToast(err instanceof Error ? err.message : t.billing.portalFailed, "danger");
    }
  }

  async function handleSaveSlots(target: number) {
    try {
      await updateSlots.mutateAsync(target);
      setSlotDraft(null);
      pushToast(t.billing.slotsUpdated);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : t.billing.slotsFailed, "danger");
    }
  }

  if (overviewQuery.isLoading) {
    return <p className="text-muted-foreground text-sm">{t.common.loading}</p>;
  }
  if (!overview) {
    return <p className="text-destructive text-sm">{t.billing.loadError}</p>;
  }

  const { entitlements, subscription, usage } = overview;
  const dateLocale = t.common.dateLocale;
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(dateLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const currentPlanKey = entitlements.plan;
  const statusLabel = subscription?.status ? t.billing.statusLabels[subscription.status] : null;
  const maxExtraSlots =
    subscription?.plan != null ? overview.planLimits[subscription.plan].maxExtraSlots : 0;
  const slots = slotDraft ?? subscription?.extraGroupSlots ?? 0;
  const canModify = subscription?.status ? MODIFIABLE_STATUSES.has(subscription.status) : false;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">{t.billing.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t.billing.subtitle}</p>
      </div>

      {entitlements.graceEndsAt ? (
        <div
          className="flex items-start gap-3 rounded-xl border p-4 text-sm"
          style={{ borderColor: "var(--warm)", background: "var(--warm-soft)" }}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--warm)" }} />
          <p>{t.billing.graceBanner(formatDate(entitlements.graceEndsAt))}</p>
        </div>
      ) : !entitlements.writable ? (
        <div className="border-destructive bg-destructive/10 flex items-start gap-3 rounded-xl border p-4 text-sm">
          <AlertTriangle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
          <p>{t.billing.readOnlyBanner}</p>
        </div>
      ) : null}

      {awaitingWebhook ? (
        <div className="bg-muted/60 rounded-xl border p-4 text-sm">
          {t.billing.confirmingPayment}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.billing.currentPlan}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-heading text-xl font-bold">
                {t.billing.planNames[currentPlanKey]}
              </span>
              {statusLabel ? (
                <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                  {statusLabel}
                </span>
              ) : null}
            </div>
            {subscription?.cancelAt ? (
              <p className="text-muted-foreground text-sm">
                {t.billing.cancelsOn(formatDate(subscription.cancelAt))}
              </p>
            ) : subscription?.currentPeriodEnd ? (
              <p className="text-muted-foreground text-sm">
                {t.billing.renewsOn(formatDate(subscription.currentPeriodEnd))}
              </p>
            ) : null}
            {overview.organization?.hasPaddleCustomer ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handlePortal}
                  disabled={portal.isPending}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  {portal.isPending ? t.billing.openingPortal : t.billing.managePayment}
                </Button>
                <p className="text-muted-foreground text-xs">{t.billing.portalHint}</p>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.billing.usageTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <UsageMeter
              label={t.billing.groupsUsed(usage.groupsUsed, entitlements.maxGroups)}
              used={usage.groupsUsed}
              max={entitlements.maxGroups}
            />
            {usage.groups.map((group) => (
              <UsageMeter
                key={group.id}
                label={group.groupName}
                used={group.members}
                max={entitlements.maxMembersPerGroup}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold">{t.billing.plansTitle}</h2>
          <div className="bg-muted flex items-center rounded-full p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setCycle("MONTHLY")}
              className={`rounded-full px-3 py-1 ${cycle === "MONTHLY" ? "bg-background shadow" : "text-muted-foreground"}`}
            >
              {t.billing.monthly}
            </button>
            <button
              type="button"
              onClick={() => setCycle("YEARLY")}
              className={`rounded-full px-3 py-1 ${cycle === "YEARLY" ? "bg-background shadow" : "text-muted-foreground"}`}
            >
              {t.billing.yearly} · {t.billing.yearlyBonus}
            </button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {(["FREE", "PRO", "ENTERPRISE"] as const).map((plan) => (
            <PlanCard
              key={plan}
              overview={overview}
              plan={plan}
              cycle={cycle}
              onSubscribed={refetchSubscription}
              onManageBilling={handlePortal}
            />
          ))}
        </div>
        <p className="text-muted-foreground text-xs">{t.billing.vatNote}</p>
        {!isPaddleConfigured() ? (
          <p className="text-muted-foreground text-xs">{t.billing.notConfigured}</p>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.billing.slotsTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">{t.billing.slotsHint}</p>
          {canModify && subscription?.plan ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={t.billing.slotsDecrease}
                  onClick={() => setSlotDraft(Math.max(0, slots - 1))}
                  disabled={slots <= 0}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="min-w-16 text-center text-sm font-semibold tabular-nums">
                  {t.billing.slotsCount(slots)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={t.billing.slotsIncrease}
                  onClick={() => setSlotDraft(Math.min(maxExtraSlots, slots + 1))}
                  disabled={slots >= maxExtraSlots}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              {slotDraft !== null && slotDraft !== subscription.extraGroupSlots ? (
                <Button
                  size="sm"
                  onClick={() => handleSaveSlots(slotDraft)}
                  disabled={updateSlots.isPending}
                >
                  {t.billing.slotsSave}
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t.billing.needSubscriptionForSlots}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
