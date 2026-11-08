---
id: sick-day-benefit
title: Offer paid sick days with the Sick day benefit
summary: Turn on the Sick day benefit so members can request Sick days against a yearly allowance.
module: organization
roles: [owner, org-admin, group-admin, manager, member]
routes: [/organization]
keywords:
  [sick day, sick days, sick day benefit, paid sick leave, wellness day, sick allowance, benefit]
related: [types-of-time-off, allowances, plans-and-limits]
goldenQuestions:
  - question: How do I give my team paid sick days?
    expectedArticles: [sick-day-benefit]
    mustMention:
      [Offer paid sick days on the Organization page, Sick days in each group's Quotas tab]
  - question: What's the difference between Sick and Sick day?
    expectedArticles: [sick-day-benefit, types-of-time-off]
    mustMention: [Sick day draws on a yearly allowance, Sick has no allowance]
---

The Sick day benefit lets members request a {{ui:calendarRecordTypes.SICK_DAY.label}}: a paid day
off from a yearly allowance, no illness needed. It is off until an administrator turns it on, and it
needs a paid plan.

{{ui:calendarRecordTypes.SICK_DAY.label}} is not the same as {{ui:calendarRecordTypes.SICK.label}}.
{{ui:calendarRecordTypes.SICK.label}} records an absence due to illness, has no allowance, and is
open to everyone.

## Turn it on

1. Open {{ui:nav.organization}}. The owner or an administrator can do this.
2. In "{{ui:organization.sickDayTitle}}", switch on "{{ui:organization.sickDayLabel}}".

Then set the allowances. Group admins give each member a number of Sick days for the year in the
group's {{ui:groupDetail.tabs.quotas}} tab, and can set a starting value for new members under
"{{ui:groupDetail.groupDefaults}}". See [Allowances](help:allowances).

## How members use it

{{ui:calendarRecordTypes.SICK_DAY.label}} appears under "{{ui:newRequest.others}}" in the request
form, in groups whose organization has the benefit on. It goes through the same approval as any
request, and "{{ui:widgets.balance.title}}" on the {{ui:nav.dashboard}} shows the days left.

Unused Sick days don't carry over into the next year. Teammates see a Sick day under its own name;
only {{ui:calendarRecordTypes.SICK.label}} is shown to them as "{{ui:calendarRecordTypes.AWAY.label}}".

## Turning it off, and lapsed plans

Turning the benefit off stops new Sick day requests. Allowances and booked Sick days stay, and
turning it on again brings everything back.

If the paid plan lapses, the benefit goes dormant the same way: nothing is deleted, the setting stays
on, and Sick days become requestable again once the organization subscribes again. Sick days already
booked can still be edited during a lapse.
