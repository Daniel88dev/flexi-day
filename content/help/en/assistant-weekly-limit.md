---
id: assistant-weekly-limit
title: Weekly limit and Usage
summary: How the Assistant's Usage counts against your organization's Weekly limit, and what happens near and at the limit.
module: assistant-and-mcp
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: []
tools: []
keywords:
  [weekly limit, usage, limit reached, paused, reset, see usage, unavailable, assistant, cost]
related: [assistant, ai-usage]
goldenQuestions:
  - question: Why did the Assistant stop answering for our organization this week?
    expectedArticles: [assistant-weekly-limit]
    mustMention: [Weekly limit, resets on Monday]
  - question: The Assistant says it is unavailable. Did we use up our limit?
    expectedArticles: [assistant-weekly-limit]
    mustMention: [the AI provider can't answer, not your organization's limit]
---

Usage is what the Assistant's answers cost your organization: the AI provider's list price for
each step of an answer, answers still being written included. Each organization has a Weekly limit
on Usage, shared by everyone in it. It resets every Monday at 00:00 UTC, shown in your own time
zone.

## Near the limit

From 80% of the limit, a bar under the message box shows how much is used and when it resets.
Members see the percentage; owners and org admins also see the amounts.

## When the limit is reached

The Assistant pauses for the whole organization until the reset, and the message box says until
when. Your chats stay readable. An answer that reaches the limit halfway keeps what it wrote and
ends with a line saying it stopped. Owners and org admins get "{{ui:assistant.limit.seeUsage}}",
which opens the [{{ui:nav.aiUsage}}](help:ai-usage) page with the organization's usage, person by
person.

## Assistant unavailable

"{{ui:assistant.unavailable}}" means the AI provider itself can't answer. It isn't your
organization's limit, and nothing counts against it.
