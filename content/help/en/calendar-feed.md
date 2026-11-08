---
id: calendar-feed
title: Subscribe to time off in Google, Outlook or Apple Calendar
summary: How to make a calendar feed of your own or your team's time off, add it to your calendar app, and keep its private link safe.
module: calendars
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/calendar-sync]
keywords:
  [
    calendar sync,
    ics,
    ical,
    feed,
    subscribe,
    subscription link,
    google calendar,
    outlook,
    apple calendar,
    team calendar,
    regenerate token,
    not updating,
  ]
related: [calendar-direct-sync, who-sees-your-time-off, dashboard-calendar]
goldenQuestions:
  - question: How do I see my team's vacations in Outlook?
    expectedArticles: [calendar-feed]
    mustMention: [Calendar sync page, My team's records, Subscribe from web]
  - question: I approved a day off but it still isn't in my Google Calendar. Why?
    expectedArticles: [calendar-feed, calendar-direct-sync]
    mustMention: [calendar app decides how often it checks, often once a day]
  - question: Someone got hold of my calendar link. How do I stop it working?
    expectedArticles: [calendar-feed]
    mustMention: [Regenerate token, old link stops working]
---

A calendar feed is a private link your calendar app subscribes to. Add it once and approved time off
keeps appearing in Google Calendar, Outlook or Apple Calendar. Feeds are free on every plan. Set
them up on the {{ui:nav.calendarSync}} page.

## Create a calendar

1. Open {{ui:nav.calendarSync}} and press "{{ui:calSync.newCalendar}}".
2. Give it a name.
3. Under "{{ui:calSync.builder.scopeLabel}}", pick "{{ui:calSync.builder.scopeMe}}" or
   "{{ui:calSync.builder.scopeTeam}}". For a team calendar, tick the groups to include.
4. Under "{{ui:calSync.builder.recordTypes}}", switch on the leave types you want and pick a colour
   for each. "{{ui:calSync.builder.groupEvents}}" and "{{ui:calSync.builder.birthdays}}" can go in
   too.
5. Press "{{ui:calSync.builder.saveNew}}". The preview beside the form shows what the feed will hold.

You can keep several calendars, for example one for yourself and one per team.

## What a feed holds

- Approved time off only: pending, rejected and cancelled requests stay out.
- The last 12 months and everything ahead.
- On a team calendar, every member of the groups where you see everyone's time off, and only your
  own records in the rest. Colleagues' Sick leave shows as Away, and their notes never go out.
- Birthdays only of people who chose to share them, never with ages.

## Add it to your calendar app

After saving, the page shows "{{ui:calSync.subscribe.linkLabel}}" and an "Add" button for each app:

- **{{ui:calSync.subscribe.google}}** opens "Add calendar from URL". The calendar then appears under
  "Other calendars".
- **{{ui:calSync.subscribe.outlook}}** opens "Subscribe from web". Name it and press Import.
- **{{ui:calSync.subscribe.apple}}**: press Add on your Mac or iPhone, confirm, and pick how often it
  refreshes.

To add it later, open the calendar's menu on its card and press "{{ui:calSync.card.copyFeedUrl}}".

## Why a change doesn't show yet

Your calendar app decides how often it reloads the link, often only once a day, and Flexi Day can't
make it hurry. For last-minute changes, check Flexi Day itself. To get your own days off into Google
or Microsoft within seconds, use [direct sync](help:calendar-direct-sync) instead.

## Keep the link private

Anyone with the link can see every record in the feed, so treat it like a password. To revoke it,
open the calendar's menu and press "{{ui:calSync.card.regenerateToken}}". The old link stops working
at once, and everyone subscribed needs the new one.

"{{ui:calSync.card.delete}}" removes the calendar and stops the feed for good. The card shows when an
app last fetched it.
