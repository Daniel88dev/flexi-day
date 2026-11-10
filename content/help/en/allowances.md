---
id: allowances
title: Allowances and how many days you have left
summary: How yearly allowances work per group and type, where to see what's left, and how admins set them.
module: quotas
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/groups/detail, /dashboard]
tools: [get_my_balances]
keywords:
  [
    quota,
    allowance,
    days left,
    remaining days,
    balance,
    entitlement,
    vacation days,
    home office days,
    sick days,
    group defaults,
    change quota,
    over allowance,
  ]
related: [year-rollover, types-of-time-off, request-time-off, sick-day-benefit]
goldenQuestions:
  - question: How many vacation days do I have left?
    expectedArticles: [allowances]
    mustMention: [My balance on the Dashboard, your organization's allowance]
  - question: How do I give one person more vacation days this year?
    expectedArticles: [allowances]
    mustMention: [Quotas tab of the group, Edit next to the member]
  - question: Why was my request refused for exceeding my allowance?
    expectedArticles: [allowances]
    mustMention: [pending requests count too, ask a group admin]
---

An allowance is the number of days a person may book of one type in one year, in one group. Three
types have one: {{ui:calendarRecordTypes.VACATION.label}},
{{ui:calendarRecordTypes.HOME_OFFICE.label}}, and {{ui:calendarRecordTypes.SICK_DAY.label}} where
the Sick day benefit is on. The numbers are your organization's own; group admins set them.

## See what you have left

"{{ui:widgets.balance.title}}" on the {{ui:nav.dashboard}} shows, for each type with an allowance,
the days left out of the total for this year, summed over your groups. Days waiting for approval are
noted beside it. The group's {{ui:groupDetail.tabs.quotas}} tab shows each member's allowance for a
year, if you have the View permission there.

## How booking uses it

- Each group has its own allowances. Time off booked in a group draws on that group's.
- A day counts against the year it falls in. A half day counts 0.5.
- A new request is refused if your approved and pending days plus the new ones would pass the
  allowance. Cancelling a request gives its days back.
- Unused {{ui:calendarRecordTypes.VACATION.label}} days carry over into the next year; see
  [Year-end carry-over](help:year-rollover).

If a request is refused for that reason, ask a group admin to raise your allowance.

## Set a member's allowance

Group admins, the manager and organization administrators can do this.

1. Open the group from {{ui:nav.groups}} and go to {{ui:groupDetail.tabs.quotas}}.
2. Pick the year with the arrows.
3. Press "{{ui:common.edit}}" next to the member, change the numbers and save.

A member with no allowance saved for a year shows the group default, marked
"{{ui:groupDetail.default}}". Saving writes their own number. Every change is recorded, with who made
it, under "{{ui:report.detail.changes}}" on the member's page in the {{ui:nav.report}}.

The days carried over from last year are set in "{{ui:report.detail.editQuota}}" on that same page,
which suggests the unused days from the year before.

## Group defaults

Under "{{ui:groupDetail.groupDefaults}}" on the {{ui:groupDetail.tabs.quotas}} tab, admins set the
allowances new members start with. Press "{{ui:groupDetail.saveDefaults}}" to keep them. Defaults
apply to members who have no allowance for a year yet; existing allowances don't change.

## External workers

External workers have no allowance and can book only types without one.
