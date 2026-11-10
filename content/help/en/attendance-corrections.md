---
id: attendance-corrections
title: Correct your attendance or add a session you forgot
summary: How to fix a clock-in or clock-out time, add a missed session or break, and how far back the organization's self-service window lets you do it yourself.
module: attendance
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/my-attendance]
keywords:
  [
    correct attendance,
    edit time,
    fix clock in,
    wrong time,
    forgot to clock in,
    missed day,
    add session,
    add break,
    manual entry,
    self-service,
    entered,
    changed later,
    delete session,
  ]
related: [clock-in-and-out, attendance-ceilings, team-attendance, attendance-setup]
goldenQuestions:
  - question: I forgot to clock in this morning. How do I fix it?
    expectedArticles: [attendance-corrections]
    mustMention: [clock in now and correct the start, Correct]
  - question: How do I add a work day I didn't record last week?
    expectedArticles: [attendance-corrections]
    mustMention: [Add session, self-service window, ask a group admin or an organization admin]
  - question: Why does my session say Changed after the day?
    expectedArticles: [attendance-corrections]
    mustMention: [admin sees it flagged, until they check it]
---

What you can fix yourself depends on your organization's employee self-service setting. An admin
can always correct anything.

## How far back you can go

{{ui:nav.myAttendance}} says which applies to you:

| Self-service         | What you can do yourself                                                  |
| -------------------- | ------------------------------------------------------------------------- |
| Off                  | Clock in and out and take breaks. Every correction goes through an admin. |
| On, today only       | Enter and correct today, and a session still running from an earlier day. |
| On, a number of days | Enter and correct today and that many days before it.                     |
| On, no limit         | Enter and correct any day of your own employment.                         |

Only organization administrators change this setting, on the {{ui:nav.organization}} page. For a day
outside your window, ask a group admin or an organization admin. After your employment ends, only
an admin can change your attendance.

## Correct a session

1. On {{ui:nav.myAttendance}}, open the day and press "{{ui:clock.correct}}".
2. Change the clock-in or clock-out time, or a break's times. Add a break with
   "{{ui:corrections.addBreak}}" or remove one.
3. Press "{{ui:corrections.save}}".

A correction moves times, never days: the start has to stay on the day the session belongs to,
while the end may cross midnight. A session can't end later than now, can't be longer than the
organization's session limit, and can't overlap another session. Breaks stay inside their session
and don't overlap each other.

"{{ui:corrections.history}}" in the same dialog lists every change to the session, with who made it.

## Add a session you forgot to clock

Press "{{ui:clock.addSession}}" on the day, set the start and end, add breaks if you took any, and
save. Switch on "{{ui:entry.nextDay}}" if it ran past midnight. The session is marked
"{{ui:clock.enteredMark}}" for good, so everyone can tell it wasn't clocked.

An added session must already be over. If you forgot to clock in and are still working, clock in
now and then correct the start time.

## Changes after the day

When you change a session after its day has passed, it shows "{{ui:clock.changedSessionMark}}", and
your admin sees it flagged on {{ui:nav.teamAttendance}} until they correct it or mark it as checked.
Nothing is blocked meanwhile.

## Deleting

You can delete a session you entered yourself, or a clocked one from today. A clocked session from
an earlier day can be corrected but only an admin can delete it, and the same goes for a session an
admin entered for you. A deleted session keeps its history and stops counting.

## Admins

Group admins correct and add sessions for the members of their groups, and organization
administrators for everyone, on any day of the person's employment. See
[Team attendance](help:team-attendance).

While the organization's plan is lapsed, attendance can be read but not corrected.
