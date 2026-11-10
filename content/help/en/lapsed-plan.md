---
id: lapsed-plan
title: When a paid plan ends or a payment fails
summary: The 14-day grace period, which groups turn read-only on the Free plan, and how to get everything back.
module: organization
roles: [owner, org-admin, manager, group-admin, approver, member]
routes: [/billing]
keywords:
  [
    lapsed,
    expired,
    read-only,
    payment failed,
    grace period,
    downgrade,
    subscription ended,
    locked group,
    can't book,
  ]
related: [plans-and-limits, manage-subscription]
goldenQuestions:
  - question: Our group says it is read-only, why?
    expectedArticles: [lapsed-plan]
    mustMention: [the plan lapsed, groups over the Free limits are read-only, nothing is deleted]
  - question: What happens to our data if we stop paying?
    expectedArticles: [lapsed-plan]
    mustMention: [14-day grace period, nothing is deleted, re-subscribing restores it]
---

When a subscription is cancelled, paused or can't be paid, your organization keeps its paid plan for
a 14-day grace period. After that it falls back to the Free plan. Nothing is deleted at any point.

## During the grace period

Everything keeps working. Banners on the {{ui:nav.billing}} page and across the app give the date
the grace period ends, and the billing email gets a warning. Update the card or subscribe again
before then and nothing changes.

## After the grace period

The organization is on the Free plan, and the plan badge on its groups reads
"{{ui:organization.planLapsed}}".

- **Groups over the Free limits turn read-only.** Free allows 3 groups. The oldest groups stay
  usable and the newer ones turn read-only, together with any group that has more than 10 members.
  Extra group slots end with the subscription.
- **In a read-only group** nobody can book, approve or change settings, quotas or invites. Everyone
  can still see it, and admins can still remove members.
- **Paid features go dormant.** New attachments and group events can't be added, clocking in is
  refused, Sick days can't be requested, and on Enterprise the people directory and the Assistant
  stop. Files, records and settings stay.

Nothing you stored disappears. Bookings, quotas, attachments already uploaded and attendance stay
readable.

## Getting back under the limits

Either subscribe again, or bring the organization within the Free limits: remove members until each
group has 10 or fewer. Removing members works even in a read-only group, for this reason.

## Subscribe again

The owner subscribes from the {{ui:nav.billing}} page. Every group turns writable and every paid
feature comes back as it was, with its settings and allowances. See
[Subscribe, change plan or cancel](help:manage-subscription).
