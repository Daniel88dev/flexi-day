---
id: worked-time-and-balance
title: Worked time, required time and your balance
summary: How Flexi Day turns sessions and breaks into worked time, which days owe no attendance, and how the daily or monthly balance is counted.
module: attendance
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/my-attendance]
keywords:
  [
    worked time,
    working hours,
    hours worked,
    balance,
    overtime,
    undertime,
    required time,
    break deduction,
    presence,
    month balance,
    excluded day,
    day off,
    half day,
    public holiday,
  ]
related: [clock-in-and-out, attendance-setup, team-attendance, half-days-and-times]
goldenQuestions:
  - question: Why was 30 minutes taken off my day when I didn't take a break?
    expectedArticles: [worked-time-and-balance]
    mustMention: [break allowance, deducted once presence passes the threshold]
  - question: Do I have to clock in on a vacation day?
    expectedArticles: [worked-time-and-balance]
    mustMention: [approved absence owes no attendance, Home office still owes time]
  - question: Does my overtime carry over to next month?
    expectedArticles: [worked-time-and-balance]
    mustMention: [balances neither carry over nor reset, left to your employer]
---

{{ui:nav.myAttendance}} shows, for each day, how long you were present, how much counts as worked,
what the day required and the difference. Switch between "{{ui:clock.views.day}}",
"{{ui:clock.views.week}}" and "{{ui:clock.views.month}}" to see it.

## How worked time is counted

- **{{ui:clock.presence}}** is the total of your sessions that day, breaks included.
- **Breaks deducted:** if presence passes the threshold (6 hours by default), the larger of the break
  allowance (30 minutes by default) and the breaks you took is deducted. Below the threshold, only
  the breaks you took are.
- **{{ui:clock.worked}}** is presence minus that.

So the allowance comes off a long day even if you never pressed "{{ui:clock.takeBreak}}", and a
longer break comes off in full. Your organization sets both numbers.

## Required time

**{{ui:clock.required}}** is your organization's required time per day (8 hours by default), unless
an admin gave you your own. A half-day absence halves it for that day.

## Days that owe nothing

No attendance is owed on a day that is:

- outside your employment, before it began or after it ended;
- not one of the organization's working days;
- a public holiday in the organization's holiday country;
- covered by an approved absence such as {{ui:calendarRecordTypes.VACATION.label}} or
  {{ui:calendarRecordTypes.SICK.label}}, in any group of the organization.

{{ui:calendarRecordTypes.HOME_OFFICE.label}} still owes time: working from home is working. A request
waiting for approval excuses nothing yet. These days show hatched on your week and month.

You can still clock in on such a day. It is flagged "{{ui:clock.excludedClockInFlag}}" and the time
counts toward the month.

## Your balance

**{{ui:clock.balance}}** is worked minus required. Your organization shows it one of two ways:

- **Each day:** every day is coloured against its own required time.
- **Over the month:** one "{{ui:clock.monthBalance}}" against the month's required time.

Mid-month, the balance counts only working days already begun, so days still to come are no
shortfall. "{{ui:clock.monthRequired}}" beside it shows what the whole month asks for.

Nothing is enforced. Balances don't carry over into the next month and don't reset; they are
reported and left to your employer.

## Why an old day changed

The rules are read when a day is shown, not when it was worked. If your organization changes the
required time, break rules, working days or holiday country, past balances move too. Only a
session's day and its timezone stay as they were at clock-in.
