---
id: attendance-ceilings
title: Forgotten clock-outs and auto-closed sessions
summary: What happens when a session or break runs past the organization's ceiling, how the auto-closed flag appears, and how to set the real time.
module: attendance
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/my-attendance, /team-attendance]
keywords:
  [
    auto-closed,
    forgot to clock out,
    session closed automatically,
    ceiling,
    maximum session,
    16 hours,
    break too long,
    flagged,
    still open,
    was closed for you,
  ]
related: [clock-in-and-out, attendance-corrections, attendance-setup, team-attendance]
goldenQuestions:
  - question: My day shows 16 hours because I forgot to clock out. How do I fix it?
    expectedArticles: [attendance-ceilings, attendance-corrections]
    mustMention: [closed at the session ceiling, Correct, set the time you actually left]
  - question: Can I change how long a session can run before it closes on its own?
    expectedArticles: [attendance-ceilings, attendance-setup]
    mustMention: [Close a session after, organization administrators, Attendance card]
---

A ceiling is the longest a session or a break may run. When someone forgets to clock out or to end
a break, Flexi Day closes it at the ceiling and flags it, so a forgotten clock-out doesn't count as
a day that never ends.

## The two ceilings

| Ceiling                                              | Default  | Range                  |
| ---------------------------------------------------- | -------- | ---------------------- |
| "{{ui:organization.attendance.sessionCeilingLabel}}" | 16 hours | 1 to 24 hours          |
| "{{ui:organization.attendance.breakCeilingLabel}}"   | 2 hours  | 15 minutes to 24 hours |

Organization administrators change them in the "{{ui:organization.attendance.title}}" card on the
{{ui:nav.organization}} page.

## What happens

A nightly run closes a session that passed its ceiling at the moment the ceiling was reached: a
session started at 08:00 with a 16-hour ceiling ends at midnight. A break that ran past its own ceiling
ends there too, and never after its session.

You get one notice in the app, linking to the day. On {{ui:nav.myAttendance}} the day shows a
"{{ui:clock.autoClosedFlag}}" mark and a message saying when it was closed. It does not stop you
from clocking in again.

A session still running from an earlier day, not yet closed by the nightly run, shows as
"{{ui:clock.stillOpenFlag}}". Clock out to close it.

## Set the real time

1. Open the flagged day on {{ui:nav.myAttendance}} and press "{{ui:clock.correct}}".
2. Change the clock-out to the time you actually left, or a break's end to when you came back.
3. Save.

Correcting the clock-out clears the flag. You can do this yourself only inside your organization's
self-service window; otherwise ask a group admin or an organization admin. See
[Correct your attendance](help:attendance-corrections).

## For admins

Auto-closed sessions show on {{ui:nav.teamAttendance}} with their own mark, so you can see who still
has to set a real time. Correcting the clock-out yourself clears the flag the same way.
