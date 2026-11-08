---
id: request-time-off
title: Request time off
summary: Book vacation or other leave for a day or a range, and what happens after you submit.
module: leave
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/dashboard, /requests]
keywords:
  [
    book,
    book leave,
    request vacation,
    day off,
    take holiday,
    new request,
    submit,
    already booked,
    book for someone,
    on behalf,
  ]
related:
  [types-of-time-off, half-days-and-times, approve-requests, cancel-or-change-a-request, allowances]
goldenQuestions:
  - question: How do I book a week of vacation?
    expectedArticles: [request-time-off]
    mustMention: [New Request, From and To, weekends and public holidays are skipped]
  - question: It says some days are already booked, what does that mean?
    expectedArticles: [request-time-off]
    mustMention: [one booking per day, cancel the existing request first]
  - question: Can I book leave for someone in my team?
    expectedArticles: [request-time-off]
    mustMention: [group admins choose the member under For, Approve immediately]
---

You request time off in a group you belong to. The request waits until an approver of that group
decides it.

## Open the request form

- Press "{{ui:newRequest.trigger}}" in the top bar. Where your groups can take group events, the
  button reads "{{ui:newRequest.menu.trigger}}"; choose "{{ui:newRequest.menu.timeOff}}".
- Or, on the {{ui:nav.dashboard}} calendar, click a day, or drag across several days on a computer.
  The form opens with those dates.

## Fill it in

1. **{{ui:newRequest.group}}**: the group the time off belongs to, if you are in more than one.
2. **{{ui:newRequest.type}}**: see [Types of time off](help:types-of-time-off).
3. **{{ui:newRequest.from}}** and **{{ui:newRequest.to}}**: the first and last day, both included.
   Pick the same day twice for a single day. You can book from 1 January this year to 31 December
   next year.
4. Optional times, half day and note. See [Half days and times](help:half-days-and-times). A note is
   required for {{ui:calendarRecordTypes.OTHER.label}}.
5. Press "{{ui:newRequest.submit}}".

On a paid plan, you can attach files once the request is sent. See
[Attach files to a request](help:attachments).

## Which days get booked

Flexi Day books one day for each working day in the range. Days the group doesn't work and public
holidays of its country are skipped and cost nothing. A range with no working day in it is refused.

You can hold only one booking per day. If a day in the range is already booked, pending or approved,
the whole request is refused and the message lists the days. Cancel the existing request first, or
pick other dates. Cancelled and rejected days are free again.

For types with an allowance, the request is refused when it would take you past what you have left
for that year, counting your pending requests too. See [Allowances](help:allowances).

## After you submit

The request shows as {{ui:status.pending}}. The group's approvers get an email and a notice in the
app. You get one when it is approved or declined. Track it on the {{ui:nav.requests}} page or under
"{{ui:widgets.approvals.yourRequests}}" on the {{ui:nav.dashboard}}.

## Booking for a member

Group admins, the manager and organization administrators can book for someone in the group. In the
form, choose the person under "{{ui:newRequest.forMember}}". "{{ui:newRequest.approveImmediately}}"
is ticked by default and creates the request already approved by you. Untick it to send the request
through the normal approval; the member is told it was filed for them.
