---
id: plans-and-limits
title: Plans, prices and limits
summary: What the Free, Pro and Enterprise plans include, what they cost, and how group and member limits work.
module: organization
roles: [owner, org-admin, manager, group-admin, member]
routes: [/billing]
keywords:
  [
    price,
    pricing,
    cost,
    free plan,
    pro,
    enterprise,
    limits,
    how many people,
    how many groups,
    group slots,
    trial,
    upgrade,
  ]
related: [manage-subscription, lapsed-plan, sick-day-benefit]
goldenQuestions:
  - question: How much does Flexi Day cost?
    expectedArticles: [plans-and-limits]
    mustMention: [Free plan, Pro, Enterprise, excluding VAT]
  - question: We have 12 people, can we stay on the free plan?
    expectedArticles: [plans-and-limits]
    mustMention: [Free allows 10 people per group, 3 groups]
  - question: Which plan do I need for attachments and attendance?
    expectedArticles: [plans-and-limits]
    mustMention: [Pro or Enterprise]
---

Every organization starts on the Free plan. The owner can move it to Pro or Enterprise on the
{{ui:nav.billing}} page. Prices exclude VAT, which is added at checkout based on your country.

## The plans

| Plan       | Price                                                                      | Groups | People per group | Extra group slots |
| ---------- | -------------------------------------------------------------------------- | ------ | ---------------- | ----------------- |
| Free       | free                                                                       | 3      | 10               | none              |
| Pro        | {{price:PRO.monthly}} a month or {{price:PRO.yearly}} a year               | 5      | 25               | up to 4           |
| Enterprise | {{price:ENTERPRISE.monthly}} a month or {{price:ENTERPRISE.yearly}} a year | 20     | 100              | up to 20          |

The price is for the whole organization, not per person. Paying yearly saves about 17%.

## What each plan adds

Free covers time off: groups, requests and approvals, quotas, reports, the Excel export and calendar
sync.

Pro and Enterprise add:

- attachments on requests (images and PDF);
- birthdays and group events on the group calendar;
- attendance with clock-in and worked time;
- the Sick day benefit;
- AI connections, which let apps such as Claude or ChatGPT work with Flexi Day.

Enterprise also adds the people directory with employee profiles, and the Assistant.

## Free trial

A first subscription starts with a free trial: 10 days on monthly billing, 2 months on yearly. You
are billed from the day it ends. An organization that already had a subscription gets no new trial
when it switches plans.

## Group slots

On a paid plan, the owner can buy extra group slots on the {{ui:nav.billing}} page, under
"{{ui:billing.slotsTitle}}". Each slot adds one group and costs {{price:SLOT.monthly}} a month or
{{price:SLOT.yearly}} a year. Slots are charged straight away, even during a trial.

## How the limits count

- **Groups.** Every group in the organization counts. When all are used, creating a group shows
  that the plan's groups are used up.
- **People per group.** Members and open invites both count, so a group at its limit can't send
  more invites. Remove a member or revoke an invite to make room.

The "{{ui:billing.usageTitle}}" card on the {{ui:nav.billing}} page shows groups used and the size
of each group. There is no limit on the number of people across the organization.

Some organizations have a custom plan with limits agreed with Flexi Day. Their {{ui:nav.billing}}
page shows those limits.
