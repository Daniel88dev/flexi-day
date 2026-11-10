---
id: calendar-direct-sync
title: Sync your days off straight into Google or Microsoft calendar
summary: How direct sync writes your own approved time off into your Google or Microsoft calendar within seconds, which plan it needs, and how to fix a sync that stopped.
module: calendars
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/calendar-sync]
keywords:
  [
    direct sync,
    connect google,
    connect microsoft,
    outlook,
    microsoft 365,
    google workspace,
    out of office,
    working location,
    needs reconnecting,
    sync failed,
    paused,
    disconnect,
  ]
related: [calendar-feed, plans-and-limits]
goldenQuestions:
  - question: Can Flexi Day set my Out of office in Outlook when my vacation is approved?
    expectedArticles: [calendar-direct-sync]
    mustMention: [Connect Microsoft, Only my records calendar, paid plan]
  - question: My calendar sync says Needs reconnecting. What do I do?
    expectedArticles: [calendar-direct-sync]
    mustMention: [Reconnect, events already in your calendar stay]
  - question: Why can't I connect Google to my team calendar?
    expectedArticles: [calendar-direct-sync, calendar-feed]
    mustMention: [teammates' records are never synced, use the subscription link]
---

Direct sync writes your own approved time off into your Google or Microsoft calendar within seconds
of a change, with no waiting for a calendar app to reload a feed. It needs a paid plan: at least one
of your groups must belong to an organization on Pro or Enterprise.

## Connect your calendar

1. Open {{ui:nav.calendarSync}} and create a calendar with "{{ui:calSync.builder.scopeMe}}", or use
   one you have. See [Subscribe to time off](help:calendar-feed).
2. In the "{{ui:calSync.connect.label}}" part of its card, press "Connect Google" or "Connect
   Microsoft".
3. Sign in to the provider and allow access to your calendar.

Back in Flexi Day, the card shows "{{ui:calSync.connect.chips.synced}}" once the first sync is done.
A calendar syncs to one provider at a time.

Team calendars can't connect. Teammates' days are never written to a personal calendar; use the
subscription link for those.

## What gets written

- Your approved time off, from 12 months back and everything ahead, into your primary calendar.
  That is the calendar your organization's sharing uses to show colleagues when you are away.
- With "{{ui:calSync.builder.groupEvents}}" on, the events of every group you are in. With
  "{{ui:calSync.builder.birthdays}}" on, only your own birthday.
- Event titles follow the language you use in Flexi Day.

How an absence looks depends on the account:

- **Google Workspace (Business Standard or higher):** a full day shows as a location chip with the
  absence type, a timed absence as Out of office, and Home office sets your working location to Home.
- **Personal Gmail and other Google accounts:** absences show as Busy events. Home office isn't
  synced.
- **Microsoft:** absences show as Out of office. Home office isn't synced.

Flexi Day touches only the events it wrote. Attendance and colleagues' birthdays are never written.

## Sync controls

The connected card shows the "{{ui:calSync.connect.timeZone}}" used for timed absences; change it
there. The "…" menu beside it holds:

- **"{{ui:calSync.connect.syncNow}}"** to run a sync at once.
- **"{{ui:calSync.connect.disconnect}}"**, which removes every event Flexi Day wrote to that calendar
  and nothing else.

## When it stops

| Card shows                                    | What to do                                                                                                 |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| "{{ui:calSync.connect.chips.needsReconnect}}" | The provider ended access. Press "{{ui:calSync.connect.reconnect}}"; events already in your calendar stay. |
| "{{ui:calSync.connect.chips.paused}}"         | No paid plan covers you. Nothing is written or removed; syncing resumes once a plan is active.             |
| "{{ui:calSync.connect.chips.failed}}"         | The last attempt failed. Press "{{ui:calSync.connect.syncNow}}" to try again.                              |

If Microsoft says an admin must approve Flexi Day, your IT admin approves it once for your company,
and then you connect again.
