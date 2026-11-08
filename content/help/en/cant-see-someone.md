---
id: cant-see-someone
title: I can't see someone or their time off
summary: Why a colleague, their time off, their birthday or their attendance is missing from your view, and who can change that.
module: troubleshooting
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/dashboard]
keywords:
  [
    can't see,
    missing,
    not showing,
    colleague missing,
    team calendar empty,
    only my vacation,
    hidden,
    where is,
    invisible,
    not visible,
  ]
related:
  [
    dashboard-calendar,
    group-permissions,
    who-sees-your-time-off,
    mirroring,
    birthdays,
    team-attendance,
    people-directory,
  ]
goldenQuestions:
  - question: The calendar only shows my own vacation, where is the rest of the team?
    expectedArticles: [cant-see-someone, dashboard-calendar]
    mustMention: [switch Show to Group, View permission]
  - question: My colleague is in another team, why can't I see when they're off?
    expectedArticles: [cant-see-someone, mirroring]
    mustMention: [only groups you belong to, mirroring]
  - question: Why does my colleague's sick leave show as Away?
    expectedArticles: [cant-see-someone, who-sees-your-time-off]
    mustMention: [Sick shows as Away to teammates]
---

What you see in Flexi Day follows the groups you belong to and the permissions you hold in them.
Find what is missing below.

## The calendar shows only you

- **{{ui:dashboard.scope.label}} is set to "{{ui:dashboard.scope.mine}}".** Switch it to
  "{{ui:dashboard.scope.group}}" and pick the group. To open the dashboard that way every time, see
  [Change your settings](help:account-settings).
- **You don't have the {{ui:groupDetail.columns.view}} permission in the group.** Without it you
  see only your own time off there, and the group isn't offered on the dashboard. A group admin can
  turn it on. See [Group permissions](help:group-permissions).

## The person is in another group

You see the time off of groups you belong to. Someone in another group doesn't appear, even in the
same organization. If your team needs to see them, a group admin can mirror their time off into your
group. See [Show someone's time off from another group](help:mirroring).

## A request is missing or looks different

- **Declined and cancelled requests** never show to teammates.
- **{{ui:calendarRecordTypes.SICK.label}}** shows to teammates as
  "{{ui:calendarRecordTypes.AWAY.label}}". Only the group's approvers and admins see the real type.
- **The leave type filter** may hide it. Check "{{ui:dashboard.filter.label}}" on the dashboard.
- **Calendar feeds** carry approved time off only, and your calendar app refreshes them on its own
  schedule. See [Subscribe to time off in your calendar app](help:calendar-feed).

See [Who sees your time off](help:who-sees-your-time-off) for the full rules.

## The person left the group

When someone is removed from a group, their pending requests and future bookings there are
cancelled, so those days disappear. Their past days stay.

## A birthday is missing

You see a colleague's birthday only if they chose to share it, you are both members of the group you
are looking at, and the group's organization has had a paid plan. See
[Add your birthday and share it](help:birthdays).

## Attendance

{{ui:nav.teamAttendance}} shows only the people you administer, as a group admin or an organization
administrator, and never external workers. Members can't see each other's attendance. See
[See and correct your team's attendance](help:team-attendance).

## The people directory

The directory is on Enterprise, and the owner turns it on. Which parts of a profile you see depends on
the organization's Permission table: colleagues see the card, photo and work contact by default, not
the job, contact or personal details. See
[Turn on the people directory and decide who sees what](help:people-directory).
