---
id: mirroring
title: Show someone's time off from another group with mirroring
summary: Mirror a member's records from one group into another so both calendars show them, without a second approval.
module: groups
roles: [manager, group-admin, org-admin, owner, member]
routes: [/groups/detail]
keywords:
  [
    mirror,
    mirroring,
    several groups,
    two teams,
    umbrella group,
    show leave in other group,
    duplicate,
    cross-team calendar,
  ]
related: [group-permissions, dashboard-calendar]
goldenQuestions:
  - question: I'm in two teams, how do both see my vacation without booking it twice?
    expectedArticles: [mirroring]
    mustMention: [Mirroring tab, approved and counted in the group it was booked in]
  - question: Why can't I approve a request that shows in my group?
    expectedArticles: [mirroring]
    mustMention: [mirrored records are read-only]
---

Mirroring shows a member's time off from one group inside another group they also belong to. Use it
when a manager wants their own leave on their team's calendar, or when several small teams feed one
umbrella group.

## What a mirrored record is

A mirrored record is a view, not a copy. It is approved, counted against the allowance and reported
only in the group it was booked in. In the other group it is read-only: nobody approves it there, and
it shows with a dashed edge and "mirrored from" the source group's name. Teammates there see it the
way any teammate does, so {{ui:calendarRecordTypes.SICK.label}} shows as
{{ui:calendarRecordTypes.AWAY.label}} and notes stay hidden.

When the person leaves the target group, their records stop showing there.

## Set it up

You need to administer both groups: the one the records come from and the one they show in. The
member has to belong to both.

1. Open the group the records should show in and go to {{ui:groupDetail.tabs.mirroring}}.
2. Under "{{ui:groupDetail.mirroring.title}}", find the member and tick the groups to mirror from.
   Only groups you administer and the member shares with this one are offered.
3. Press "{{ui:groupDetail.mirroring.save}}".

A source group that someone else administers shows as locked; an admin of that group sets it.

## As a member

The {{ui:groupDetail.tabs.mirroring}} tab shows you which of your groups are mirrored into this one.
Only an admin of the group can change it.

## Where mirrored records show

They appear on the group's {{ui:nav.dashboard}} calendar and on the {{ui:nav.requests}} page when you
look at that group. Reports and the Excel export count each record only in its own group.
