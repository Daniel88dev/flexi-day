---
id: group-settings
title: Set a group's working days and public holidays
summary: Choose which weekdays a group books leave on and which country's public holidays it skips.
module: groups
roles: [manager, group-admin, org-admin, owner]
routes: [/groups/detail]
keywords:
  [
    working days,
    weekend,
    work week,
    part time,
    public holidays,
    bank holidays,
    national holidays,
    holiday country,
    country,
  ]
related: [create-a-group, request-time-off, allowances]
goldenQuestions:
  - question: We work Sunday to Thursday, can Flexi Day handle that?
    expectedArticles: [group-settings]
    mustMention: [Working days on the group's Settings tab]
  - question: Why don't public holidays show on our calendar?
    expectedArticles: [group-settings]
    mustMention: [Public holidays country in the group's Settings tab]
---

The group's {{ui:groupDetail.tabs.settings}} tab holds two settings that decide which days a request
books. Group admins, the manager and organization administrators see this tab.

## Working days

Under "{{ui:groupDetail.workingDays}}", tick the weekdays the group works and press
"{{ui:groupDetail.saveWorkingDays}}". At least one day is needed.

Requests book only these days. When someone requests a range, the other days in it are skipped, so
a Friday-to-Monday request in a Monday-to-Friday group books two days and counts two against the
allowance. A range with no working day in it is refused.

Working days belong to the group, so everyone in it shares them. They apply to new requests;
existing bookings stay as they are.

## Public holidays

Under "{{ui:groupDetail.holidayCountry}}", pick the "{{ui:groupDetail.holidayCountryLabel}}" and
press "{{ui:groupDetail.saveHolidayCountry}}". "{{ui:groupDetail.holidayCountryNone}}" turns them
off.

The country's public holidays then:

- show on the {{ui:nav.dashboard}} calendar for everyone in the group;
- are skipped when someone requests a range, like non-working days, so they cost no allowance.

They are never exported to calendar feeds.

## Where else these settings matter

Attendance has its own working days and holiday country, set for the whole organization on the
{{ui:nav.organization}} page. The group's settings don't change attendance.
