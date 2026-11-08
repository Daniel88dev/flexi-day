---
id: dashboard-calendar
title: See who is away on the dashboard
summary: Read the dashboard calendar, switch between your own and your group's time off, filter by type, and use the cards beside it.
module: leave
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/dashboard]
keywords:
  [
    dashboard,
    calendar,
    who is away,
    who is off,
    out today,
    team calendar,
    month view,
    filter,
    legend,
    balance,
    public holidays,
  ]
related: [account-settings, request-time-off, who-sees-your-time-off, allowances]
goldenQuestions:
  - question: How can I see who from my team is off next week?
    expectedArticles: [dashboard-calendar]
    mustMention: [Dashboard calendar, switch Show to Group]
  - question: Why do I only see my own vacation on the calendar?
    expectedArticles: [dashboard-calendar]
    mustMention: [Me or Group, View permission]
---

The {{ui:nav.dashboard}} is the first page after you sign in. Its month calendar shows who is away,
and the cards around it show what needs your attention.

## The calendar

Move between months with the arrows beside the month name. Each request shows on the days it covers,
with the person and the type. A half day carries a "{{ui:calendar.halfDayMark}}" mark. Public
holidays of the group's country, group events and birthdays show on their days too.

Click a request to open its details. Click an empty day, or drag across days on a computer, to
request time off for those dates. Right-click a day for "{{ui:newRequest.menu.requestTimeOff}}" and,
where your plan has them, "{{ui:newRequest.menu.newGroupEvent}}".

## Me or your group

"{{ui:dashboard.scope.label}}" switches between "{{ui:dashboard.scope.mine}}" and
"{{ui:dashboard.scope.group}}". With the group, pick which one. You can pick only groups where you
have the View permission; without it you see just your own time off. The group view includes time
off mirrored in from other groups.

To change what the calendar opens with, and to choose between the "{{ui:settings.layoutLanes}}" and
"{{ui:settings.layoutStripes}}" layouts, see [Change your settings](help:account-settings).

## Filter by type

"{{ui:dashboard.filter.label}}" hides or shows types of time off, for example to see only home
office days. The legend under the calendar names the colours.

## The cards

- **Stats:** {{ui:dashboard.stats.pendingApprovals}}, {{ui:dashboard.stats.outToday}},
  {{ui:dashboard.stats.comingUp}} and {{ui:dashboard.stats.workingToday}}.
- **{{ui:widgets.approvals.title}}:** for approvers, requests waiting on you, with buttons to decide
  them. Everyone sees their own requests still waiting under
  "{{ui:widgets.approvals.yourRequests}}".
- **{{ui:widgets.outToday.title}}:** who is off today.
- **{{ui:widgets.balance.title}}:** how many days you have left this year for each type with an
  allowance, across your groups, with pending days noted. See [Allowances](help:allowances).

## No groups yet

A new account in no group sees "{{ui:dashboard.noGroupsTitle}}" with forms to join a group or create
one. See [Join a group](help:join-a-group) and [Create a group](help:create-a-group).
