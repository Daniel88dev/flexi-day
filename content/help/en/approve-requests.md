---
id: approve-requests
title: Approve or decline time off requests
summary: Where approvers find waiting requests, how to approve or decline with a reason, and who may decide.
module: leave
roles: [approver, manager, group-admin, org-admin]
routes: [/requests, /dashboard]
keywords:
  [
    approve,
    approval,
    decline,
    reject,
    deny,
    pending requests,
    waiting for approval,
    approver,
    comment,
    reason,
  ]
related: [group-permissions, request-time-off, cancel-or-change-a-request, mirroring]
goldenQuestions:
  - question: Where do I see requests waiting for my approval?
    expectedArticles: [approve-requests]
    mustMention: [Pending approvals on the Dashboard, Requests page]
  - question: Can I approve my own vacation?
    expectedArticles: [approve-requests]
    mustMention: [only with the Approver permission in that group]
  - question: I'm an org admin, why is there no Approve button?
    expectedArticles: [approve-requests, organization-roles]
    mustMention: [organization administrators can't approve, Approver permission inside the group]
---

Requests in a group are decided by its approvers: members with the Approver permission, and the
group's manager. You get an email and a notice in the app when a request waits for you.

## Find waiting requests

- **{{ui:nav.dashboard}}:** the "{{ui:widgets.approvals.title}}" card lists what waits on you, with
  "{{ui:widgets.approvals.approve}}" and "{{ui:widgets.approvals.decline}}" buttons.
- **{{ui:nav.requests}}:** pick the group and the months, then filter by
  "{{ui:requests.filters.pending}}". Each row is one whole request, with
  "{{ui:requests.approve}}" and "{{ui:requests.reject}}" buttons.
- **The calendar:** click a request to open its details.

## Decide with a reason

Open the request details to see the dates, the type, the note, the files and the history. Type a
comment or reason in the box, then press "{{ui:vacationDetail.approve}}" or
"{{ui:vacationDetail.decline}}". The comment appears in the request's history and the member is
notified of the decision.

A decision covers the whole request, every day of it. A declined request is final; the member books
again if needed. An approved request can still be cancelled later, by the member or by you.

To ask a question without deciding, write it and press "{{ui:vacationDetail.comment}}". The member is
notified, and their reply notifies the approvers.

## Who may decide

- Members with the Approver permission and the group's manager.
- Not organization administrators: they manage groups but decide on nobody's leave. To approve, they
  need the Approver permission inside the group.
- Not on records mirrored in from another group. They are decided in the group they were booked in.

You can decide your own request only if you hold the Approver permission in that group. Otherwise
another approver decides it.

## Allowances when approving

Approving checks the member's allowance for that type and year, counting only days already approved.
A request that would take them past it can't be approved; a group admin can raise the allowance
first. See [Allowances](help:allowances).
