---
id: assistant-changes
title: Confirm changes the Assistant prepares
summary: How the Assistant's confirmation cards work, for your own changes and for approving or rejecting requests, and what happens when you confirm one, decline it or move on.
module: assistant-and-mcp
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: []
tools:
  [
    create_request,
    cancel_my_request,
    clock_in,
    clock_out,
    list_requests_to_approve,
    approve_request,
    reject_request,
  ]
keywords:
  [
    assistant,
    card,
    confirm,
    confirmation,
    not now,
    keep it,
    try again,
    not taken,
    book,
    cancel,
    clock in,
    clock out,
    note,
    warning,
    approve,
    reject,
    waiting for approval,
    reason,
  ]
related:
  [
    assistant,
    request-time-off,
    cancel-or-change-a-request,
    clock-in-and-out,
    approve-requests,
    assistant-weekly-limit,
  ]
goldenQuestions:
  - question: Can the Assistant book a day off for me?
    expectedArticles: [assistant-changes, assistant]
    mustMention: [you confirm the card, nothing changes before you confirm]
  - question: Why does a card say the Assistant read a note written by someone else?
    expectedArticles: [assistant-changes]
    mustMention: [check that the card matches what you asked for]
  - question: Can the Assistant approve a request for me?
    expectedArticles: [assistant-changes, approve-requests]
    mustMention: [approve or reject card, never recommends]
---

Ask the Assistant to book time off, cancel one of your own requests, or clock you in or out, and it
prepares the change as a card in the chat. Approvers can also approve or reject requests this way.
Nothing changes until you confirm the card.

## What a card shows

The card asks a question, such as "{{ui:assistant.cards.title.create_request}}", and lists the
details Flexi Day worked out with the same rules the app uses: the type, the dates, the working
days, your balance before and after, and the group. A note or reason you asked for appears word for
word, with a line saying whose words they are. The details come from Flexi Day, never from the
Assistant's own wording. Every card says "{{ui:assistant.cards.madeThrough}}".

If the rules don't allow the change, for example because your balance is too low, you get no card.
The Assistant tells you why instead.

## Confirm or leave it

- "{{ui:assistant.cards.confirm.create_request}}", "{{ui:assistant.cards.confirm.cancel_my_request}}",
  "{{ui:assistant.cards.confirm.clock_in}}" or "{{ui:assistant.cards.confirm.clock_out}}" makes the
  change. Flexi Day checks the rules again at that moment. The card shrinks to one line with the
  result and "{{ui:assistant.cards.open}}", which opens your requests or your attendance.
- "{{ui:assistant.cards.notNow}}", or "{{ui:assistant.cards.keepIt}}" on a cancellation, leaves
  everything as it was.
- If the change fails when you confirm, for example because the day was booked in the meantime, the
  card shows the reason in red and stays open. "{{ui:assistant.cards.tryAgain}}" tries once more.
- Sending a new message instead marks any card still waiting as not taken. It can't be confirmed
  afterwards; ask again for a fresh card.

When the Assistant prepares two changes at once, each gets its own card and you decide them one by
one. It carries on writing once you have decided them all.

A change made this way reads "{{ui:common.channel.assistant}}" in the request's history or in the
attendance history of that day. Approvers are notified as for a request made in the app.

## Approve or reject a request

If you approve time off, ask "What's waiting for my approval?" and the Assistant lists the requests
waiting for you. Ask it to approve or reject one and you get a card with the requester, the type, the
dates, the working days, their balance before and after, the group, and the request's own note word
for word with who wrote it. The Assistant never recommends approving or rejecting; the decision is
yours.

- "{{ui:assistant.cards.confirm.approve_request}}" approves every day of the request still waiting.
- "{{ui:assistant.cards.confirm.reject_request}}" rejects them. The card has a field for a reason the
  requester reads; leave it empty to reject without one.

The requester is notified as when you decide in the app, and the request's history reads
"{{ui:common.channel.assistant}}". The same rules apply as in the app: you decide only in groups
where you approve, and an approval must fit the requester's allowance. Approving and rejecting work
only in the Assistant, not in AI apps you connect.

## A note written by someone else

Before preparing a change, the Assistant may read text other people wrote, such as the note on a
colleague's time off or a group event's title. When it did, the card names who wrote it and asks you
to check that this is what you asked for. Someone could write a note meant to steer the Assistant,
so make sure the card matches what you asked for before you confirm.

## At the Weekly limit

A card already shown stays confirmable when your organization reaches its Weekly limit. Confirming
makes the change, but the Assistant replies to it only after the limit resets, with your next
message. See [Weekly limit and Usage](help:assistant-weekly-limit).
