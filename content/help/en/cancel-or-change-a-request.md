---
id: cancel-or-change-a-request
title: Cancel or change a request
summary: Cancel your own pending or approved time off, and how dates, types and times get changed.
module: leave
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/requests, /dashboard]
keywords:
  [
    cancel,
    cancel vacation,
    withdraw,
    delete request,
    change dates,
    move vacation,
    edit request,
    modify,
    mistake,
    wrong type,
  ]
related: [request-time-off, approve-requests, half-days-and-times]
goldenQuestions:
  - question: How do I cancel a vacation that was already approved?
    expectedArticles: [cancel-or-change-a-request]
    mustMention: [Cancel request in the request details, approved requests can be cancelled]
  - question: I booked the wrong dates, can I change them?
    expectedArticles: [cancel-or-change-a-request]
    mustMention: [dates can't be edited, cancel and book again]
---

You can cancel your own requests at any time, whether pending or approved. Dates can't be edited:
to move time off, cancel the request and book the new dates.

## Cancel a request

- Open the request from the {{ui:nav.dashboard}} calendar or the {{ui:nav.requests}} page and press
  "{{ui:vacationDetail.cancelRequest}}" in the details. This cancels every day of it.
- Or, on the {{ui:nav.requests}} page, press "{{ui:requests.cancel}}" on the row.

The days are free again straight away and stop counting against your allowance. The request stays
on the {{ui:nav.requests}} page as {{ui:status.cancelled}}, with who cancelled it. When an approved
request is cancelled, the group's approvers are notified.

## Who else can cancel

The group's approvers, its admins and organization administrators can cancel a member's request too,
with an optional reason saved in its history. The member is notified.

## Change a request

| What you want to change     | How                                                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Dates                       | Cancel and book again. Nobody can edit dates.                                                                    |
| Type, half day, times, note | A group admin, the manager or an organization administrator presses "{{ui:vacationDetail.edit}}" in the details. |
| A declined request          | It is final. Book again.                                                                                         |

When someone else edits your request, you get a notice, and its history shows "{{ui:vacationDetail.events.UPDATED}}" with what
changed. A change of type or half day is checked against your allowance again.

## The request history

The details show the request's history to you, the group's approvers and its admins: when it was
requested, approved, declined, cancelled, commented on or edited, and by whom. A change made through
the Assistant or an AI app says so there. Teammates don't see the history.

## Removed from a group

If a group admin removes you from a group, your pending requests there and your approved
time off from tomorrow on are cancelled. Past days and today stay.
