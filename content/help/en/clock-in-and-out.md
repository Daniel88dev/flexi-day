---
id: clock-in-and-out
title: Clock in, clock out and take a break
summary: How to clock in and out and take breaks on My attendance, what a session is, and why the clock might be off for you.
module: attendance
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/my-attendance]
tools: [get_my_attendance]
keywords:
  [
    clock in,
    clock out,
    punch in,
    check in,
    start work,
    break,
    lunch break,
    pause,
    session,
    timer,
    clocking is off,
    location,
  ]
related:
  [
    worked-time-and-balance,
    attendance-corrections,
    attendance-ceilings,
    attendance-setup,
    iphone-app,
  ]
goldenQuestions:
  - question: How do I start my work day in Flexi Day?
    expectedArticles: [clock-in-and-out]
    mustMention: [My attendance, Clock in]
  - question: Why can't I clock in? It says clocking in is off.
    expectedArticles: [clock-in-and-out]
    mustMention: [organization switched attendance off or its plan lapsed, ask an org admin]
  - question: I forgot to clock out yesterday. What happens?
    expectedArticles: [clock-in-and-out, attendance-ceilings]
    mustMention: [closed at the session ceiling, set the real time]
---

If your organization uses attendance, you record your working time on {{ui:nav.myAttendance}}. The
page holds the clock and today's sessions. On a phone browser, the round "{{ui:clock.open}}" button in
the bottom bar opens the same clock, and the iPhone app has it too.

## Clock in and out

1. Open {{ui:nav.myAttendance}}.
2. Press "{{ui:clock.clockIn}}". The clock shows "{{ui:clock.clockedIn}}" and the time since.
3. When you stop, press "{{ui:clock.clockOut}}".

Each clock-in to clock-out is one session. You can clock in several times a day; the day adds the
sessions up. The times are the server's, not your device's.

You are clocked in once per organization, however many groups you are in. If you already clocked in
somewhere else, such as on your phone, Flexi Day tells you since when, and you clock out there or
here when you are done.

A session belongs to the day it started, so a night shift that crosses midnight counts on its first
day.

## Take a break

While clocked in, press "{{ui:clock.takeBreak}}", and "{{ui:clock.endBreak}}" when you are back.
Clocking out ends a running break at the same moment. Breaks count against your worked time; see
[Worked time and your balance](help:worked-time-and-balance).

## Today's sessions

Under the clock, "{{ui:clock.today}}" lists your sessions and breaks with
"{{ui:clock.presence}}" and "{{ui:clock.breaks}}" totals. Switch to
"{{ui:clock.views.week}}" or "{{ui:clock.views.month}}" for earlier days.

## Forgot to clock in or out

- **Forgot to clock out:** a session left running closes by itself at the organization's ceiling, 16
  hours by default, and is flagged. Set the time you really left; see
  [Forgotten clock-outs](help:attendance-ceilings).
- **Forgot to clock in:** add the session afterwards, if your organization allows it; see
  [Correct your attendance](help:attendance-corrections).

## Location

Some organizations record where you clock. If yours does, a notice on the clock says so once, and
your browser asks for your location at each clock-in and clock-out. You can say no; the clock
works the same and nothing marks the refusal.

## When the clock is off

- **"{{ui:clock.inactiveTitle}}"**: your organization switched attendance off, or its plan lapsed. A
  session you left running can still be closed, and your history stays readable. Ask an org admin.
- **"{{ui:clock.externalTitle}}"**: external workers don't clock in and owe no time.
- **"{{ui:clock.employmentEnded}}"**: you have left the organization. Your history stays readable.

You see {{ui:nav.myAttendance}} in the sidebar only while attendance is on for you, or while you
still have a session running.
