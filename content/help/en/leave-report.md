---
id: leave-report
title: Read the leave report for your team
summary: What the Report page shows, whose data you see on it, and what each column of the Members table means.
module: reports
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/report, /report/member]
keywords:
  [
    report,
    reports,
    leave report,
    usage,
    statistics,
    overview,
    team usage,
    days used,
    days left,
    remaining,
    planned,
    member detail,
    charts,
  ]
related: [export-report, allowances, year-rollover, group-permissions, who-sees-your-time-off]
goldenQuestions:
  - question: Where can I see how many vacation days everyone in my team has used this year?
    expectedArticles: [leave-report]
    mustMention: [Report page, Members table, View permission]
  - question: Why do I only see my own numbers in the report?
    expectedArticles: [leave-report, group-permissions]
    mustMention: [View permission, only your own rows]
  - question: What is the difference between Planned and Pending in the report?
    expectedArticles: [leave-report]
    mustMention: [Planned is approved days still ahead, Pending waits for approval]
---

The {{ui:nav.report}} page sums up time off for the groups you belong to or administer: monthly
charts per leave type and a table of each member's allowance. Open it from the sidebar.

## Whose data you see

- In a group where you hold the View permission, or which you administer or manage, you see every
  member.
- In a group where you are a plain member, you see only your own rows.
- Organization administrators see every group of the organization, also groups they don't belong
  to.

Someone else's Sick leave, rejected requests and notes show only to that group's approvers and
admins, organization administrators included. Everyone else sees the person's other time off
without them. Your own rows are always complete.

If you are in no group with data for the year, the page shows "{{ui:report.empty.title}}".

## Filter the report

The filter bar narrows everything on the page:

- **{{ui:report.filters.period}}**: "{{ui:report.filters.lastTwelveMonths}}" (the default) or one
  calendar year.
- **{{ui:report.filters.groups}}**, **{{ui:report.filters.members}}** and
  **{{ui:report.filters.types}}**: pick one or several, or leave them on "all".

## The charts

Each leave type gets a "Monthly usage" panel with a bar per member per month and the total for the
window. Types with an allowance ({{ui:calendarRecordTypes.VACATION.label}},
{{ui:calendarRecordTypes.HOME_OFFICE.label}}, and {{ui:calendarRecordTypes.SICK_DAY.label}} where
the Sick day benefit is on) also get a "Days left" panel. Only the first panel opens by itself;
press a panel's title to open or close it. A half day counts 0.5.

## The Members table

One line per member, group and leave type with an allowance:

| Column                          | Meaning                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| {{ui:report.table.carriedOver}} | Unused days brought over from last year                           |
| {{ui:report.table.yearQuota}}   | The allowance for the year, or the group default if none is saved |
| {{ui:report.table.usedToDate}}  | Days already taken                                                |
| {{ui:report.table.planned}}     | Approved days still ahead this year                               |
| {{ui:report.table.pending}}     | Days waiting for approval                                         |
| {{ui:report.table.remaining}}   | Carried over plus year quota, minus used and planned              |

Pending days are not taken off {{ui:report.table.remaining}}, but a new request still counts them
against the allowance. See [Allowances](help:allowances).

## One member's year

Press a member's name to open their detail page. It shows their allowance per group, monthly
charts, every booking of the year with its status, and "{{ui:report.detail.changes}}": each change
an admin made to their allowance, with who made it and when. Changes made at the turn of the year
show as made automatically.

Group admins, the manager and organization administrators also get
"{{ui:report.detail.editQuota}}" there, for the current year only. It sets the allowance and the
days carried over; see [Year-end carry-over](help:year-rollover).

To download the same data as a spreadsheet, see [Export the report to Excel](help:export-report).
