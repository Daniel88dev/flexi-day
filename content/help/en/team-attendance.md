---
id: team-attendance
title: See and correct your team's attendance
summary: What group admins and organization administrators see on Team attendance, what its marks mean, and how to correct, add or check someone's session.
module: attendance
roles: [manager, group-admin, org-admin, owner]
routes: [/team-attendance]
keywords:
  [
    team attendance,
    who is in,
    who is clocked in,
    attendance dashboard,
    timesheet,
    team hours,
    flagged,
    mark as checked,
    correct employee time,
    add session for someone,
    attendance overview,
  ]
related:
  [
    attendance-corrections,
    attendance-ceilings,
    worked-time-and-balance,
    attendance-setup,
    group-permissions,
  ]
goldenQuestions:
  - question: How can I see who is at work right now?
    expectedArticles: [team-attendance]
    mustMention: [Team attendance, In now]
  - question: An employee changed their own hours after the day. How do I approve that?
    expectedArticles: [team-attendance, attendance-corrections]
    mustMention: [Mark as checked, no approval workflow]
  - question: Why can't I see the manager's attendance on Team attendance?
    expectedArticles: [team-attendance]
    mustMention:
      [manager is not a member of the group they manage, organization administrators see everyone]
---

{{ui:nav.teamAttendance}} shows the attendance of the people you administer: who is in now, each
person's worked time per day, and the days that need a look. It appears in the sidebar for group
admins and organization administrators while attendance is on.

## Who you see

| You are                           | You see                                                   |
| --------------------------------- | --------------------------------------------------------- |
| Group admin, or a group's manager | The members of the groups you administer                  |
| Organization administrator, owner | Everyone in the organization, people in no group included |

A group's manager is never one of that group's members, so other admins of the group don't see the
manager's attendance; organization administrators do. External workers don't appear.

On days off, someone's {{ui:calendarRecordTypes.SICK.label}} shows as Away unless you approve or
administer the group the absence was booked in.

## Read the dashboard

- **"{{ui:teamAttendance.inNow}}"** lists who is clocked in right now, and who is on a break.
- Pick "{{ui:teamAttendance.views.week}}", "{{ui:teamAttendance.views.month}}" or
  "{{ui:teamAttendance.views.range}}" (at most 93 days). Filter by group, or by organization if you
  administer several.
- Each cell is one person's worked time on one day. Hatched days owe no attendance.

The marks:

- **Auto-closed:** the session ran past the ceiling and closed by itself; the real time still needs
  setting. See [Forgotten clock-outs](help:attendance-ceilings).
- **Still open:** a session running from an earlier day.
- **Excluded day:** someone clocked in on a day off; the time counts toward the month.
- **Entered:** recorded after the fact rather than clocked, for good.
- **Changed later:** the person changed it after the day, until you correct it or mark it checked.

The line about employee self-service at the top says what members may fix themselves.
Organization administrators change it with "{{ui:teamAttendance.selfServiceChange}}".

## Correct or add a session

- Open a person's day to correct their clock-in, clock-out or breaks, or to delete a session. Every
  change is kept in the session's history with your name.
- Press "{{ui:teamAttendance.addSession}}" in an empty cell to enter a session for them. It is
  marked "{{ui:clock.enteredMark}}", and they see it that way.

Admins can change any day of the person's employment, also after it ended. While the plan is
lapsed, attendance can be read but not changed.

## Mark as checked

When a person changed a session after its day, it stays flagged until you look at it. If their
change is right, open the day and press "{{ui:corrections.markChecked}}". That moves no time. If it
is wrong, correct it, which clears the flag too. There is no approval step: the admin is the
authority.
