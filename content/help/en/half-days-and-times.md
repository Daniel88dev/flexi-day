---
id: half-days-and-times
title: Book half a day or add times
summary: Book a half day that counts as 0.5, add start and end times, and add a note to a request.
module: leave
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/dashboard, /requests]
keywords:
  [
    half day,
    half-day,
    morning off,
    afternoon off,
    hours,
    time,
    start time,
    end time,
    doctor appointment,
    note,
    partial day,
  ]
related: [request-time-off, allowances]
goldenQuestions:
  - question: How do I take just the afternoon off?
    expectedArticles: [half-days-and-times]
    mustMention: [Half day, counts as 0.5 days]
  - question: Can I book a half day for several days in a row?
    expectedArticles: [half-days-and-times]
    mustMention: [half day only on a single day, one request per day]
---

A request can cover part of a day. Tick "{{ui:newRequest.halfDay}}" to book half a day, and add
times if your team wants to know when you are out.

## Half a day

1. Open the request form and pick the same day in "{{ui:newRequest.from}}" and
   "{{ui:newRequest.to}}".
2. Tick "{{ui:newRequest.halfDay}}". The box appears only when the request is a single day.
3. Submit as usual.

A half day counts as 0.5 days against the allowance of types that have one. It shows on the calendar
with a "{{ui:calendar.halfDayMark}}" mark. The form doesn't ask whether it is the morning or the
afternoon; add times or a note to say so.

To book half days on several dates, send one request for each date.

## Start and end times

"{{ui:newRequest.startTime}}" and "{{ui:newRequest.endTime}}" are optional. They tell colleagues and
approvers when you are out, for example for a doctor's appointment, and show on the
{{ui:nav.requests}} page in the "{{ui:requests.columns.time}}" column. Times don't change how much
the request counts: a full day counts 1, a half day 0.5, whatever the times say.

On a range of several days, the times apply to every day of it.

## The note

"{{ui:newRequest.note}}" is free text for your approver, such as "Family trip". It is required for
the {{ui:calendarRecordTypes.OTHER.label}} type. Only you, the group's approvers and its admins see
the note; teammates don't. See [Who sees your time off](help:who-sees-your-time-off).

## Changing it later

You can't change a half day or times on a request you sent; cancel it and book again. A group admin
can change the type, half day, times and note of an existing request. See
[Cancel or change a request](help:cancel-or-change-a-request).
