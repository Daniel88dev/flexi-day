---
id: assistant
title: What the Assistant can do
summary: Ask the Assistant about Flexi Day in plain language, and let it prepare changes you confirm.
module: assistant-and-mcp
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/organization]
tools: [search_docs, read_doc]
keywords:
  [
    assistant,
    chat,
    ai,
    ask,
    question,
    weekly limit,
    usage,
    confirm,
    card,
    turn on,
    agreement,
    tell members,
    panel,
    past chats,
    new chat,
  ]
related: [ai-connections]
goldenQuestions:
  - question: Can the Assistant book a day off for me?
    expectedArticles: [assistant]
    mustMention: [you confirm the card, nothing changes before you confirm]
  - question: Why did the Assistant stop answering for our organization this week?
    expectedArticles: [assistant]
    mustMention: [Weekly limit, resets on Monday]
---

The Assistant is a chat in the Flexi Day web app. Ask it a question in English or Czech and it
answers from the help articles and from the data you can already see in the app. It sees exactly
what you can see, nothing more.

## Who can use it

The Assistant comes with the Enterprise plan. It is off until the owner turns it on in the AI card
on the {{ui:nav.organization}} page. Once it is on, every member finds an "{{ui:assistant.button}}"
button in the top bar on every page. The iPhone app doesn't have it.

Until then, members don't see the button. On a plan without Enterprise only the owner sees it, and
it explains what Enterprise adds. On Enterprise with the Assistant off, the owner and org admins see
it, with a link to the organization settings.

## Using the panel

The button opens a panel on the right of the page, so you can keep working beside it. On a phone it
fills the screen. A new chat suggests a few questions to start with. If more than one of your
organizations has the Assistant, pick the organization before your first message: a chat stays in
the one it starts in.

You see each step the Assistant takes, such as checking your balance, above its answer. While an
answer is being written you can't send another message. If the connection drops, the panel says the
answer is still being written and picks it up again.

"{{ui:assistant.pastChats}}" lists your chats under {{ui:assistant.history.today}},
{{ui:assistant.history.thisWeek}} and {{ui:assistant.history.earlier}}. You can delete a chat there;
it can't be brought back. "{{ui:assistant.newChat}}" starts a fresh one.

## Turning it on and off

Only the owner can turn the Assistant on or off, with the switch in the AI card on the
{{ui:nav.organization}} page. Org admins see the switch but can't change it. Before it turns on, the
owner reads what the Assistant does and what leaves Flexi Day. The first time, they accept the AI
features agreement for the organization, and Flexi Day records who accepted, when, and which
version.

"{{ui:aiSettings.turnOn.tellMembers}}" is ticked by default and sends everyone in the organization a
notice in the app and on their phone. The owner can copy the same text from the AI card with
"{{ui:aiSettings.card.copyNotice}}", for example into your own policy.

When a new version of the agreement comes out, the owner sees a banner on every page until they
accept it. The Assistant keeps working meanwhile. Turning the Assistant off takes it away from
members at once; their chats stay readable until they are 180 days old.

## What you can ask

- How-to questions, such as how to book half a day or how to clock in. Answers from the help end
  with "From the help:" links to the articles they came from.
- Questions about your own data and what you are allowed to see: how many days you have left, who
  is away next week, whether a request was approved, how much you worked this week.
- For approvers, the details of a request waiting for a decision.

The Assistant answers Flexi Day questions only. It doesn't give legal advice (ask your HR team or
your employer), doesn't write free text for you, and never recommends approving or rejecting
someone's request.

## Changes you confirm

The Assistant can prepare a change: create a request, cancel one of your requests, approve or reject
a request, clock in or clock out. Each change shows up as a card with the exact details. Nothing
changes until you confirm the card. Choose "Not now" to drop it. A change made this way reads
"{{ui:common.channel.assistant}}" in the request's history or in the attendance history of that
day.

## Weekly limit

Each organization has a Weekly limit on the Assistant's usage. It resets every Monday at 00:00
UTC, shown in your own time zone. When the limit is reached, the Assistant stops answering until
the reset. Owners and org admins see the organization's usage, person by person, on the AI usage
page.

## Chats

Each chat belongs to one organization. A chat closes when it gets too long or after 30 days without
a message; you can still read it, and you start a new chat to carry on. Chats are deleted 180 days
after their last message, and you can delete one yourself at any time. When you leave an
organization, your chats in it are deleted.

The Assistant runs on Anthropic's Claude models. The AI features agreement the owner accepts
explains where chats are stored and for how long.
