---
id: group-events
title: Add a group event to the team calendar
summary: Put a meeting, an offsite or a recurring team day on a group's calendar, and change or delete one date, the rest or all of it.
module: group-events
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/dashboard]
tools: [list_group_events]
keywords:
  [
    group event,
    team event,
    meeting,
    offsite,
    team lunch,
    recurring event,
    repeat,
    weekly meeting,
    shared event,
    delete event,
    edit event,
  ]
related: [dashboard-calendar, birthdays, calendar-feed, calendar-direct-sync, plans-and-limits]
goldenQuestions:
  - question: How do I put our weekly team meeting on the calendar for everyone?
    expectedArticles: [group-events]
    mustMention: [New group event, Repeat, Weekly]
  - question: Why can't I edit the event my colleague added?
    expectedArticles: [group-events]
    mustMention: [only the person who added it or a group admin]
  - question: Can we add group events on the Free plan?
    expectedArticles: [group-events, plans-and-limits]
    mustMention: [paid plan, existing events stay]
---

A group event is a date on a group's calendar that isn't anyone's time off: a team meeting, an
offsite, a release day. Everyone in the group sees it on the {{ui:nav.dashboard}} calendar and in the
iPhone app.

## Who can add one

Any member of the group can add a group event, including members without the
{{ui:groupDetail.columns.view}} permission, and so can the group's admins. The group's organization must be on a paid plan: Pro, Enterprise or a
custom plan, the grace period included. Where none of your groups can take one, the button and menu
items for it don't appear.

## Add a group event

1. Press "{{ui:newRequest.menu.trigger}}" in the top bar and choose
   "{{ui:newRequest.menu.groupEvent}}". On the {{ui:nav.dashboard}} you can also right-click a day and
   choose "{{ui:newRequest.menu.newGroupEvent}}", or pick a day and use the button under it.
2. Fill in "{{ui:groupEvents.title}}", up to 100 characters, and pick the
   "{{ui:groupEvents.group}}".
3. Set the date. A one-off event can run over several days with "{{ui:groupEvents.from}}" and
   "{{ui:groupEvents.until}}".
4. Leave "{{ui:calendar.groupEvent.allDay}}" on, or turn it off and set
   "{{ui:groupEvents.starts}}" and "{{ui:groupEvents.ends}}".
5. Add a "{{ui:groupEvents.note}}" if you like, up to 1,000 characters.
6. Press "{{ui:groupEvents.create}}".

## Make it repeat

Under "{{ui:groupEvents.repeat.label}}", pick "{{ui:groupEvents.repeat.daily}}",
"{{ui:groupEvents.repeat.weekly}}", "{{ui:groupEvents.repeat.monthly}}" or
"{{ui:groupEvents.repeat.yearly}}", and how often: every 1 to 99 days, weeks, months or years.

- **{{ui:groupEvents.repeat.weekly}}** repeats on the weekdays you tick. The start date's weekday is always one of them.
- **{{ui:groupEvents.repeat.monthly}}** repeats on the same day of the month, or on the same weekday such as the 2nd Tuesday
  or the last Friday. A day a month lacks falls on its last day.
- **{{ui:groupEvents.repeat.endsLabel}}**: "{{ui:groupEvents.repeat.endsNever}}" or "{{ui:groupEvents.repeat.endsOnDate}}".

"{{ui:groupEvents.repeat.nextDates}}" previews the next six dates. A recurring event lasts one day,
so it can't also run over several days.

## Change or delete an event

Pick the day on the calendar to see its group events as cards, each with
"{{ui:calendar.groupEvent.edit}}" and "{{ui:calendar.groupEvent.delete}}". On a computer you can also
right-click the day.

Only the person who added the event, while still in the group, and the group's admins can change or
delete it. For everyone else, the card says who can.

For a recurring event, Flexi Day asks which dates the change applies to:

- **"{{ui:groupEvents.scope.thisEvent}}"**: only the date you picked. The card then reads
  "{{ui:calendar.groupEvent.changedOnce}}".
- **"{{ui:groupEvents.scope.following}}"**: that date and every later one. Earlier dates stay.
- **"{{ui:groupEvents.scope.all}}"**: every date, past ones included.

Changing the repeat rule or the start for all dates drops the changes made to single dates. Flexi Day
counts them and warns you first.

Deleting can't be undone. The event leaves every calendar, including calendar feeds and synced
Google or Microsoft calendars.

## When the plan ends

On a group whose paid plan has lapsed, the existing events stay on the calendar and can still be
edited and deleted. New events can't be added, and neither can an edit that starts a new run of dates
or makes a one-off repeat. See [When a paid plan ends](help:lapsed-plan).

## Where else they show

- Calendar feeds and direct sync can carry group events. See
  [Subscribe to time off in your calendar app](help:calendar-feed) and
  [Sync your days off into Google or Microsoft calendar](help:calendar-direct-sync).
- Adding, changing or deleting a group event sends no email or notification.
