---
id: who-sees-your-time-off
title: Who sees your time off
summary: What teammates, approvers and admins see of your requests, and how sick leave and notes stay private.
module: leave
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/dashboard, /requests]
keywords:
  [
    privacy,
    private,
    who can see,
    visible,
    sick leave privacy,
    away,
    notes,
    hidden,
    confidential,
    teammates,
  ]
related: [types-of-time-off, attachments, group-permissions, mirroring]
goldenQuestions:
  - question: Can my colleagues see that I'm off sick?
    expectedArticles: [who-sees-your-time-off]
    mustMention: [teammates see Sick only as Away]
  - question: Who can read the note I write on my request?
    expectedArticles: [who-sees-your-time-off]
    mustMention: [you, the group's approvers and its admins]
---

Your time off is visible to your group, but some details stay with you and the people who manage your
leave.

## What teammates see

Teammates are the people in your group with the View permission. On the calendar and the
{{ui:nav.requests}} page they see:

- that you are off, on which days, and the type of time off;
- {{ui:calendarRecordTypes.SICK.label}} only as "{{ui:calendarRecordTypes.AWAY.label}}";
- pending and approved requests, but never your declined or cancelled ones.

They don't see your note, the reason for a decision, the comments, the history or the attachments.

## What approvers and admins see

The approvers and admins of the group your request belongs to, including organization
administrators, see everything: the real type, the note, comments, history and attachments. These
are the request's private details.

A record mirrored into another group shows there the way it shows to teammates, even to that group's
approvers and admins. Its private details stay with the group it was booked in.

## Members without View

A member without the View permission sees only their own time off in the group, not anyone else's.
A group admin can turn View on. See [Group permissions](help:group-permissions).

## Reports

In the report, the same rule holds: people who see your record only as a teammate never see your
{{ui:calendarRecordTypes.SICK.label}} days there.
