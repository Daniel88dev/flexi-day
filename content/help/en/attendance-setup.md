---
id: attendance-setup
title: Turn on attendance and set its rules
summary: How an organization admin switches attendance on, and what the timezone, working days, breaks, required time, ceilings, location and self-service settings do.
module: attendance
roles: [org-admin, owner]
routes: [/organization]
keywords:
  [
    attendance,
    time tracking,
    clocking,
    enable attendance,
    attendance settings,
    working hours,
    required time,
    break allowance,
    timezone,
    working days,
    holiday country,
    geolocation,
    gps,
    part-time,
  ]
related:
  [
    clock-in-and-out,
    worked-time-and-balance,
    attendance-ceilings,
    attendance-corrections,
    team-attendance,
    plans-and-limits,
  ]
goldenQuestions:
  - question: How do I start tracking working hours for my company?
    expectedArticles: [attendance-setup]
    mustMention: [Attendance card on the Organization page, Pro or Enterprise, timezone]
  - question: One of our people works part-time. Can they have a shorter required day?
    expectedArticles: [attendance-setup]
    mustMention: [People card, Required per day]
  - question: Does Flexi Day track where people clock in?
    expectedArticles: [attendance-setup, clock-in-and-out]
    mustMention: [off by default, browser asks each time, kept for twelve months]
---

Attendance lets people clock in and out, take breaks and see their worked time. It belongs to the
whole organization, not to one group, and runs on Pro and Enterprise. The owner and organization
administrators set it up on the {{ui:nav.organization}} page, in the
"{{ui:organization.attendance.title}}" card.

## Turn it on

1. Open {{ui:nav.organization}} and find the "{{ui:organization.attendance.title}}" card.
2. Choose the "{{ui:organization.attendance.timezoneLabel}}". It is required, and it sets where one
   day ends: a night shift belongs to the day it started.
3. Switch on "{{ui:organization.attendance.switchLabel}}" and save.

From then on, everyone in the organization sees {{ui:nav.myAttendance}} in the sidebar, and group
admins and organization administrators also see {{ui:nav.teamAttendance}}.

## The rules

| Setting                                            | Default                                     | What it does                                                          |
| -------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------- |
| {{ui:organization.attendance.holidayCountryLabel}} | none                                        | Public holidays there owe no attendance                               |
| {{ui:organization.attendance.workingDaysLabel}}    | Monday-Friday                               | Other days owe nothing; time clocked on them still counts             |
| {{ui:organization.attendance.breakAllowanceLabel}} | 30 min                                      | Deducted from every day longer than the threshold, break taken or not |
| {{ui:organization.attendance.breakThresholdLabel}} | 6 h                                         | Below it, only breaks actually taken are deducted                     |
| {{ui:organization.attendance.requiredPerDayLabel}} | 8 h                                         | The worked time each working day asks for                             |
| {{ui:organization.attendance.balanceLabel}}        | {{ui:organization.attendance.balanceDaily}} | Show the balance per day or over the month                            |
| {{ui:organization.attendance.sessionCeilingLabel}} | 16 h                                        | A session nobody clocked out of closes here and is flagged            |
| {{ui:organization.attendance.breakCeilingLabel}}   | 2 h                                         | A forgotten break ends here and is flagged                            |

[Worked time and your balance](help:worked-time-and-balance) shows how these add up, and
[Forgotten clock-outs](help:attendance-ceilings) covers the ceilings.

Required time, breaks, working days and holiday country count for every day, past ones included,
so a change moves earlier balances too. A new timezone applies from the next clock-in. Every change
to these settings is logged with who made it and the values before and after.

## A different required time for one person

For someone whose contract differs, set their own "{{ui:organization.people.requiredLabel}}" on the
"{{ui:organization.people.title}}" card of the same page. Clear it to return them to the
organization's value. External workers owe no required time.

## Location

"{{ui:organization.attendance.locationLabel}}" is off by default. When on, the browser asks each
person for permission at every clock-in and clock-out. Saying no is never recorded or flagged.
Coordinates are kept for twelve months. Agreeing this with your people is the organization's
responsibility.

## Employee self-service

"{{ui:organization.attendance.selfServiceLabel}}" decides whether people may enter sessions they
forgot to clock and correct their own times, and how many days back. It is off for a new
organization. See [Correct your attendance](help:attendance-corrections).

## When the plan lapses

Attendance goes dormant: nobody can clock in or start a break, but a running session can still be
closed and all history stays readable. Nothing is deleted, and subscribing again restores it.
Switching attendance off works the same way.
