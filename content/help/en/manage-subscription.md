---
id: manage-subscription
title: Subscribe, change plan or cancel
summary: How the owner subscribes, switches between plans and billing cycles, updates the card, gets invoices and cancels.
module: organization
roles: [owner, org-admin]
routes: [/billing]
keywords:
  [
    billing,
    subscribe,
    payment,
    credit card,
    invoice,
    receipt,
    cancel subscription,
    downgrade,
    upgrade,
    yearly,
    monthly,
    vat,
  ]
related: [plans-and-limits, lapsed-plan, organization-roles]
goldenQuestions:
  - question: Where do I download our invoices?
    expectedArticles: [manage-subscription]
    mustMention: [Manage payment method on the Billing page, billing portal]
  - question: How do I cancel our subscription?
    expectedArticles: [manage-subscription]
    mustMention: [billing portal, only the owner]
  - question: Why can't I change the plan? I'm an admin.
    expectedArticles: [manage-subscription]
    mustMention: [only the owner can change the subscription]
---

The {{ui:nav.billing}} page shows your organization's plan, its usage and the plans you can move to.
Only the owner can change the subscription. Administrators see the same page with a note that they
can't change anything.

## Subscribe

1. Open {{ui:nav.billing}}.
2. Under "{{ui:billing.plansTitle}}", pick "{{ui:billing.monthly}}" or "{{ui:billing.yearly}}".
3. Press "{{ui:billing.subscribe}}" on Pro or Enterprise and pay in the checkout window.

Payments go through Paddle, which handles the card and adds VAT for your country. Confirming the
payment usually takes a few seconds; the page then shows the new plan. A first subscription starts
with a free trial; see [Plans, prices and limits](help:plans-and-limits).

## Switch plan or billing cycle

With an active subscription, choose the other plan or billing cycle and press
"{{ui:billing.switchPlan}}". The change applies straight away, and the price difference is charged
or credited for the rest of the period.

## Card, invoices and cancelling

"{{ui:billing.managePayment}}" in the "{{ui:billing.currentPlan}}" card opens the billing portal.
There you update your card, download invoices or cancel the plan.

A cancelled plan keeps working until the end of the period you paid for; the page shows the date as
"Cancels on". After that, a 14-day grace period starts and then the organization moves to the Free
plan. Nothing is deleted. See [When a paid plan ends](help:lapsed-plan).

## Group slots

Add or remove extra group slots under "{{ui:billing.slotsTitle}}" with the plus and minus buttons,
then press "{{ui:billing.slotsSave}}". Each slot costs {{price:SLOT.monthly}} a month or
{{price:SLOT.yearly}} a year, excluding VAT.

## Billing email

Subscription warnings, such as a failed payment, go to the organization's billing email. The owner
changes it on the {{ui:nav.organization}} page under "{{ui:organization.billingEmailLabel}}".

## Payment overdue

When a payment fails, the plan shows "{{ui:billing.statusLabels.past_due}}" and a banner tells you
the date until which everything keeps working. Update the card in the billing portal before then.
