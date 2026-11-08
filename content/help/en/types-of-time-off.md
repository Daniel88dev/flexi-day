---
id: types-of-time-off
title: Types of time off
summary: The record types you can book, which ones draw on an allowance, and what each is for.
module: leave
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/dashboard, /requests]
keywords:
  [
    leave types,
    vacation,
    home office,
    work from home,
    wfh,
    sick,
    sick leave,
    paid time off,
    pto,
    unpaid leave,
    study leave,
    bank holiday,
    other,
  ]
related: [request-time-off, sick-day-benefit, allowances, who-sees-your-time-off]
goldenQuestions:
  - question: Which leave types count against my days?
    expectedArticles: [types-of-time-off]
    mustMention: [Vacation, Home Office, Sick day]
  - question: How do I log working from home?
    expectedArticles: [types-of-time-off, request-time-off]
    mustMention: [Home Office type, has its own allowance]
---

Every request has a type. The request form shows the three common ones as buttons and the rest under
"{{ui:newRequest.others}}".

## The types

| Type                                            | Use it for                                                   | Allowance           |
| ----------------------------------------------- | ------------------------------------------------------------ | ------------------- |
| {{ui:calendarRecordTypes.VACATION.label}}       | Paid annual leave. The default on a new request.             | Yes, carries over   |
| {{ui:calendarRecordTypes.HOME_OFFICE.label}}    | Working remotely: away from the office, not from work.       | Yes                 |
| {{ui:calendarRecordTypes.SICK.label}}           | Absence due to illness.                                      | No                  |
| {{ui:calendarRecordTypes.PAID_TIME_OFF.label}}  | Paid absence that is neither annual leave nor a benefit day. | No                  |
| {{ui:calendarRecordTypes.NON_PAID_LEAVE.label}} | Unpaid absence.                                              | No                  |
| {{ui:calendarRecordTypes.STUDY_LEAVE.label}}    | Time spent studying, kept apart from vacation.               | No                  |
| {{ui:calendarRecordTypes.SICK_DAY.label}}       | A paid day off from the Sick day benefit, no illness needed. | Yes, where it is on |
| {{ui:calendarRecordTypes.OTHER.label}}          | Anything else. A note saying what it is is required.         | No                  |
| {{ui:calendarRecordTypes.BANK_HOLIDAY.label}}   | A company-wide closure. Not offered in the request form.     | No                  |

## Which types use an allowance

{{ui:calendarRecordTypes.VACATION.label}}, {{ui:calendarRecordTypes.HOME_OFFICE.label}} and
{{ui:calendarRecordTypes.SICK_DAY.label}} each draw on their own yearly allowance in the group. A
request that would take you past it is refused. Only unused vacation days carry over into the next
year. See [Allowances](help:allowances) and [Year-end carry-over](help:year-rollover).

The other types book without any limit, but they still need approval and still show on the calendar
and in reports.

## Sick and Sick day

{{ui:calendarRecordTypes.SICK_DAY.label}} appears only in groups whose organization has turned on
the Sick day benefit on a paid plan. See [Sick day benefit](help:sick-day-benefit).
{{ui:calendarRecordTypes.SICK.label}} is always available. Teammates see a
{{ui:calendarRecordTypes.SICK.label}} record only as "{{ui:calendarRecordTypes.AWAY.label}}", and
reports leave it out for them. See [Who sees your time off](help:who-sees-your-time-off).

## External workers

An external worker can book only types that draw on no allowance, such as
{{ui:calendarRecordTypes.NON_PAID_LEAVE.label}}.
