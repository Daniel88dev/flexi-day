---
id: year-rollover
title: Year-end carry-over of unused days
summary: What happens to allowances on 1 January, how unused vacation days carry over, and how an admin corrects the result.
module: quotas
roles: [member, manager, group-admin, org-admin, owner]
routes: [/groups/detail]
keywords:
  [
    carry over,
    carryover,
    rollover,
    new year,
    unused days,
    leftover days,
    expire,
    next year,
    january,
  ]
related: [allowances, types-of-time-off]
goldenQuestions:
  - question: Do my unused vacation days carry over to next year?
    expectedArticles: [year-rollover]
    mustMention: [unused vacation days carry over, home office and sick days don't]
  - question: My carried over days look wrong after New Year, who fixes it?
    expectedArticles: [year-rollover]
    mustMention: [group admin, Edit quota, Carried over from previous year]
---

On the first night of a new year, Flexi Day opens the new year's allowances for everyone in every
group, by itself. Unused vacation days come along; nothing else carries over.

## What the new year gets

For each member of each group:

- **{{ui:calendarRecordTypes.VACATION.label}}, {{ui:calendarRecordTypes.HOME_OFFICE.label}} and
  Sick days** start at the same yearly numbers as last year. A member who had no allowance of their
  own last year starts from the group defaults.
- **Carried over** gets last year's unused vacation days: last year's vacation allowance, plus what
  was carried into it, minus the vacation days booked. Pending days count as booked, and the result is
  rounded down to whole days.
- Unused {{ui:calendarRecordTypes.HOME_OFFICE.label}} and Sick days expire.

Carried-over days add to the new year's vacation allowance, so "{{ui:widgets.balance.title}}" on
the {{ui:nav.dashboard}} shows them in the total.

## When it runs

Every night, Flexi Day opens the current year for anyone who doesn't have it yet. So the new year
appears on the first night of January, and a member who joins later gets theirs from the group
defaults when they join. An allowance an admin already saved for the year is never overwritten.

Each automatic change appears under "{{ui:report.detail.changes}}" on the member's page in the
{{ui:nav.report}}, marked "{{ui:report.detail.bySystem}}".

## Correct the carry-over

A group admin, the manager or an organization administrator opens the member's page in the
{{ui:nav.report}} and presses "{{ui:report.detail.editQuota}}". The dialog shows
"{{ui:report.quotaDialog.carriedOver}}" with a suggestion based on last year's unused days, which
they can accept or override. Only the current year can be edited there. The yearly numbers can also
be changed on the group's {{ui:groupDetail.tabs.quotas}} tab; see [Allowances](help:allowances).

## Cancelling last year's days later

Carry-over is worked out once, on the night it runs. Cancelling a request from last year after that
doesn't change the carried-over number; ask a group admin to correct it.

## External workers

External workers get no allowance in the new year either, so nothing carries over for them.
